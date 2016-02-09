import mongoose from 'mongoose';
import Hubkit from 'hubkit';
import Promise from 'bluebird';
import ini from 'ini';
import semver from 'semver';
import _ from 'lodash';
import dotize from 'dotize';

import app from '~/';
import Jenkins from './jenkins';
import ReleaseSchema from './release';
import IssueSchema from './issue';
import appHook from '~/appHook';

const gh = new Hubkit();

// Mongoose schema for applications
const ApplicationSchema = new mongoose.Schema({
  github: {
    owner:      String,          // Owner of the GitHub repository
    name:       String,          // Github Repository name
    repoUrl:    String,          // GitHub Git Repository url
    APItoken:   String,          // GitHub accessToken of the latest user
    label: {                     // Github issue label
      type:     String,
      default: 'AppHub',
    },
  },
  initalized: {                  // If the application is ready for Houston
    type:       Boolean,
    default:    false,
  },
  name:         String,          // Applications actual name
  package:      String,          // Debian Package Name
  version:      String,          // Currently published & reviewed version
  priceUSD:     Number,          // An integer, from .apphub file
  icon:         String,          // Base64-encoded application icon
  dists: {                       // Dists-Arch for builds eg. trusty-amd64
    type:      [String],
    default:  ['trusty-amd64', 'trusty-i386'],
  },
  issue:       IssueSchema,      // Current Github issue for application
  releases:    [ReleaseSchema],  // All releases for application
});

// Make all virtual properties show up in toJSON and toObject
ApplicationSchema.set('toJSON', { virtuals: true });
ApplicationSchema.set('toObject', { virtuals: true });

// Application virtual properties
ApplicationSchema.virtual('github.fullName').get(function() {
  return `${this.github.owner}/${this.github.name}`;
});

ApplicationSchema.virtual('release.latest').get(function() {
  this.releases = this.releases.sort((a, b) => {
    return semver.compare(a.version, b.version);
  });

  return this.releases[this.releases.length - 1];
});

ApplicationSchema.virtual('status').get(function() {
  if (!this.initalized) {
    return 'UNINITIALIZED'
  }

  if (this.issue.problems.error.length > 0) {
    return 'FAILED';
  }

  if (this.release.latest == null) {
    return 'STANDBY';
  }

  return this.release.latest.status;
});

// Cleans up application object to something easily loggable
// Used for development only!
ApplicationSchema.methods.toClean = function() {
  let application = _.cloneDeep(this.toObject());

  if (typeof application.icon === 'string') { // Trim super long encoded data
    application.icon = 'Trimmed icon data!';
  }

  return application;
}

// Updates or creates a release based on query, updates with object
// Returns mongoose update promise
ApplicationSchema.methods.upsertRelease = function(query, object) {
  const application = this;

  // Create an object from query using dot notation instead of objects ('releases.github.id')
  const dotQuery = dotize.convert(query, 'releases');
  // Create a new object of dotQuery, but with mongodb's not operator for value
  const notDotQuery = _.mapValues(dotQuery, value => ({ $ne: value }));

  return Promise.all([ // Return two promises (need mongodb $setOnUpdate for single function)
    Application.update(_.extend({ // Find an application with same _id, and includes release query
      _id: application._id,
    }, dotQuery), { // Set release to new object
      'releases.&': object,
    }),
    Application.update(_.extend({ // Find an application that has _id but does not include release
      _id: application._id,
    }, notDotQuery), {
      $addToSet: {
        releases: object, // Push new release into array
      },
    }),
  ]);
}

// Fetch all releases from Github
// Returns promise of saved application
ApplicationSchema.methods.releaseFetchAll = function() {
  const application = this;
  const fullName = application.github.fullName;

  return Promise.all(gh.request(`GET /repos/${fullName}/releases`, {
    token: application.github.APItoken,
  }))
  .filter(release => {
    return semver.valid(release.tag_name, true);
  })
  .then(releases => { // Log releases for easier development
    const releaseString = (releases.length === 1) ? 'release' : 'releases';
    app.log.silly(`${fullName} has ${releases.length} GitHub ${releaseString}`);
    return releases;
  })
  .each(release => {
    return application.upsertRelease({
      github: {
        id:      release.id,
      },
    }, {
      github: {
        id:      release.id,
        author:  release.author.login,
        date:    release.published_at,
        tag:     release.tag_name,
      },
      changelog: release.body.match(/.+/g),
    });
  })
  .then(data => {
    return Application.findOne({_id: application._id});
  });
}

// Application methods
// Helper function for application status
// Returns a boolean always
ApplicationSchema.methods.isStatus = function(query) {
  return this.status === query;
}

// Runs update test for application
// Returns Promise of null on success
ApplicationSchema.methods.runHook = function(level = 'commit') {
  const application = this;

  return appHook.test(level, application)
  .then(messages => {
    return application.update({
      'issue.problems.error': messages.error,
      'issue.problems.warning': messages.warning,
    });
  })
  .then(data => {
    return Promise.resolve(null);
  });
}

// Pushes Github issue label to repository
// Returns Promise of null on success
ApplicationSchema.methods.pushLabel = function() {
  const application = this;
  const fullName = application.github.fullName;
  const label = application.github.label;

  return gh.request(`POST /repos/${fullName}/labels`, {
    token: application.github.APItoken,
    body: {
      name: label,
      color: '3A416F',
    },
  })
  .then(data => {
    return Promise.resolve(null);
  })
  .catch(error => {
    if (error.status === 422) { // Already created labels don't create errors
      return Promise.resolve(null);
    }

    return Promise.reject(error);
  });
}

// Github methods
// Updates all database data from Github
// Returns promise of saved application on success
ApplicationSchema.methods.fetchGithub = function() {
  let application = this;

  return Promise.all([
    application.releaseFetchAll(),
    application.runHook('commit'),
  ])
  .then(() => {
    return Application.findOne({_id: application._id});
  });
}

// Updates all Github data from database
// Returns promise of same application on success
ApplicationSchema.methods.pushGithub = function() {
  const application = this;

  return application.pushLabel();
}

// Updates all database data from Github and Github from database data
// Returns saved application including 'errors' always
ApplicationSchema.methods.syncGithub = function() {
  let application = this;

  return application.fetchGithub()
  .then(application => application.pushGithub()); // Push doesn't save anything
}

// Other methods
// TODO: add release target for changelog generation (default to latest)
// Generates changelog
// Returns array of promises of generated changelogs
ApplicationSchema.methods.changelog = function(params) {
  const application = this;
  const fullName = application.github.fullName;

  let promises = [];
  for (let i = 0; i < params.length; i++) {
    promises.push(new Promise((resolve, reject) => {
      app.render('changelog', {
        layout:   false,
        dist:     params[i].DIST,
        package:  params[i].PACKAGE,
        releases: application.releases,
      }, (error, changelog) => {
        if (error) {
          return reject(error);
        }

        params[i].CHANGELOG = changelog;
        return resolve(params[i]);
      });
    }));
  }

  // Nice messages are Nice
  const distString = (promises.length === 1) ? 'changelog' : 'changelogs';
  const releaseString = (application.releases.length === 1) ? 'release' : 'releases';
  app.log.silly(`Generated ${promises.length} ${distString} for ${fullName}'s ${application.releases.length} ${releaseString}`);

  return promises;
}

// Other statics
// Updates build given update data
// Returns promise of saved build
ApplicationSchema.statics.updateBuild = function(data) {
  // Grab IDENTIFIER string in the form of application._id#release._id#build._id
  const [applicationId, releaseId, buildId] = data.IDENTIFIER.split('#');

  return Application.findOne({_id: applicationId})
  .then(application => {
    if (application == null) {
      return Promise.reject('Application not found');
    }

    return application.releases.id(releaseId);
  })
  .then(release => {
    if (release == null) {
      return Promise.reject('Release not found');
    }

    return release.builds.id(buildId);
  })
  .then(build => {
    if (build == null) {
      return Promise.reject('Build not found');
    }

    return build.update(data)
  });
}

// Application creation and exportation
const Application = mongoose.model('application', ApplicationSchema);

export { ApplicationSchema, Application };
