import mongoose from 'mongoose';
import Hubkit from 'hubkit';
import Promise from 'bluebird';
import ini from 'ini';
import semver from 'semver';
import _ from 'lodash';

import app from '~/';
import IssueSchema from './issue';
import Jenkins from './jenkins';
import ReleaseSchema from './release';
import { update } from '~/test';

const gh = new Hubkit();

// Mongoose schema for applications
const ApplicationSchema = mongoose.Schema({
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
  name:         String,          // Applications actual name
  package:      String,          // Debian Package Name
  version:      String,          // Currently published & reviewed version
  priceUSD:     Number,          // An integer, from .apphub file
  icon:         String,          // Base64-encoded application icon
  dists: {                       // Dists-Arch for builds eg. trusty-amd64
    type:      [String],
    default:  ['trusty-amd64', 'trusty-i386'],
  },
  issue:        IssueSchema ,    // Current Github issue for application
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
  if (this.release.latest == null) {
    return 'STANDBY';
  }

  return this.release.latest.status;
});

// Release methods
// Finds an index of a release based on query
// Returns a number on success (-1 on not found)
ApplicationSchema.methods.releaseFindOneIndex = function(query) {
  const application = this;

  const i = _.findIndex(application.releases, function(iRelease) {
    return _.isMatch(iRelease, query)
  });

  return i;
}

// Updates or creates a release based on query, updates with object
// Returns promise of new application object
ApplicationSchema.methods.releaseUpdateOrCreate = function(query, object) {
  const application = this;
  const i = application.releaseFindOneIndex(query);

  if (i === -1) { // Create a new release
    Application.update({_id: application._id}, {
      $push: {
        releases: object,
      },
    }, (error, info) => {
      if (error) {
        return Promise.reject(error)
      }

      return Application.findOne({_id: application._id});
    });
  }

  Application.update({ // Update already created release
    _id: application._id,
    releases: query,
  }, {
    $set: {
      'releases.$': object,
    },
  }, (error, info) => {
    if (error) {
      return Promise.reject(error)
    }

    return Application.findOne({_id: application._id});
  });
}

// Fetch all releases from Github
// Returns saved application on success
ApplicationSchema.methods.releaseFetchAll = function() {
  const application = this;
  const fullName = application.github.fullName;
  app.log.silly(`application releaseFetchAll called for ${fullName}`);

  const githubReleases =  gh.request(`GET /repos/${fullName}/releases`, {
    token: application.github.APItoken,
  })
  .catch(error => {
    return Promise.reject(`Received ${error.status} from github`);
  });

  return Promise.filter(githubReleases, release => {
    return semver.valid(release.tag_name, true);
  })
  .map(release => {
    return application.releaseUpdateOrCreate({
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
  .catch(error => {
    return Promise.reject(error);
  })
  .then(applications => {
    return Application.findOne({_id: application._id});
  });
}

// Application methods
// Helper function for application status
// Returns a boolean always
ApplicationSchema.methods.isStatus = function(query) {
  return this.status === query;
}

// Pushes Github issue label to repository
// Returns Promise with no data on success
ApplicationSchema.methods.pushLabel = function() {
  const application = this;
  const fullName = application.github.fullName;
  const label = application.github.label;
  app.log.silly(`application pushLabel called for ${fullName}`);

  return gh.request(`POST /repos/${fullName}/labels`, {
    token: application.github.APItoken,
    body: {
      name: label,
      color: '3A416F',
    },
  })
  .catch(error => {
    if (error.status === 422) { // Already created labels don't create errors
      return Promise.resolve();
    }
    return Promise.reject(error);
  });
}

// Github methods
// Updates all database data from Github
// Returns promise of saved application on success
ApplicationSchema.methods.fetchGithub = function() {
  let application = this;
  const repoName = application.github.name;
  const fullName = application.github.fullName;
  app.log.silly(`application fetchGithub called for ${fullName}`);

  return application.releaseFetchAll()
  .then(application => application.save());
}

// Updates all Github data from database
// Returns promise of same application on success
ApplicationSchema.methods.pushGithub = function() {
  const application = this;
  const repoName = application.github.name;
  const fullName = application.github.fullName;
  app.log.silly(`application pushGithub called for ${fullName}`);

  return application.pushLabel();
}

// Updates all database data from Github and Github from database data
// Returns saved application including 'errors' always
ApplicationSchema.methods.syncGithub = function() {
  let application = this;
  const repoName = application.github.name;
  const fullName = application.github.fullName;
  app.log.silly(`application syncGithub called for ${fullName}`);

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
  app.log.silly(`application changelog called for ${fullName}`);

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

  return promises;
}

// Other statics
// Updates build given update data
// Returns promise of saved build
ApplicationSchema.statics.updateBuild = function(data) {
  // Grab IDENTIFIER string in the form of application._id#release._id#build._id
  const [applicationId, releaseId, buildId] = data.IDENTIFIER.split('#');
  app.log.silly(`application updateBuild called for ${data.IDENTIFIER}`);

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
    .catch(error => {
      return Promise.reject(error);
    });
  });
}

ApplicationSchema.pre('save', next => {
  console.log(this);

//  if (this.isNew) {
//    return update(this)
//    .then(messages => {
//      this.issue.problems = messages;
//    }, err => {
//      app.log.error(`A testing error occured with ${application.github.fullName}`);
//      app.log.error(err);
//    })
//    .then(() => {
//      return next();
//    })
//  }

  return next();
})

// Application creation and exportation
var Application = mongoose.model('application', ApplicationSchema);

export { ApplicationSchema, Application };
