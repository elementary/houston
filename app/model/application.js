import mongoose from 'mongoose';
import Hubkit from 'hubkit';
import Promise from 'bluebird';
import ini from 'ini';
import semver from 'semver';
import _ from 'lodash';

import app from '~/';
import Jenkins from './jenkins';
import ReleaseSchema from './release';
import IssueSchema from './issue';

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
  priceUSD:     Number,          // An integer, from appHubFileResult
  icon: {
    name:       String,          // 'wingpanel'
    data:       String,          // <base64-encoded image>
  },
  dists: {                       // Dists-Arch for builds eg. trusty-amd64
    type:      [String],
    default:  ['trusty-amd64', 'trusty-i386'],
  },
  issue:        IssueSchema ,    // Current Github issue for application
  problems: [{                   // All repository problems
    type:       String,
    enum: [
      'missingDesktop',          // Missing desktop file
      'unparsableDesktop',       // Unparsable desktop file
      'missingApphub',           // Missing apphub file
      'unparsableApphub',        // Unparsable apphub file
      'missingIcon',             // Missing application icon
      'invalidPrice',            // Price is not a float value
      'invalidLabel',            // Label is not a string
    ],
  },],
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

// Helper function for application problems
// Returns a boolean always
ApplicationSchema.methods.hasProblem = function(query) {
  return this.problems.indexOf(query) >= 0;
}

// Sets an application problem based on status or toggles if no status
// Returns nothing
ApplicationSchema.methods.setProblem = function(query, isSolved = !this.hasProblem(query)) {
  if (isSolved && !this.hasProblem(query)) {
    this.problems.push(query);
  } else if (!isSolved && this.hasProblem(query)) {
    this.problems = _.pull(this.problems, query);
  }
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

// Fetches appHub file in repository
// Returns promise of unsaved application object
ApplicationSchema.methods.fetchApphub = function() {
  let application = this;
  const fullName = application.github.fullName;
  app.log.silly(`application fetchApphub called for ${fullName}`);

  return gh.request(`GET /repos/${fullName}/contents/.apphub`, {
    token: application.github.APItoken,
  })
  .catch(error => {
    if (error.status === 404) {
      application.setProblem('missingApphub', true);
      return Promise.resolve(application);
    }
    application.setProblem('missingApphub', false);
    return Promise.reject(`Received ${error.status} from github`);
  })
  .then(apphubData => {
    let apphubJSON = {};
    try {
      const apphubBase = new Buffer(apphubData.content, 'base64');
      apphubJSON = JSON.parse(apphubBase.toString());
    } catch (error) {
      application.setProblem('unparsableApphub', true);
      return Promise.resolve(application);
    }
    application.setProblem('unparsableApphub', false);

    if (typeof apphubJSON.priceUSD === 'number') {
      application.priceUSD = apphubJSON.priceUSD;
      application.setProblem('invalidPrice', false);
    } else if (typeof apphubJSON.priceUSD != 'undefined') {
      application.setProblem('invalidPrice', true);
    } else {
      application.setProblem('invalidPrice', false);
    }

    if (typeof apphubJSON.issueLabel === 'string') {
      application.github.label = apphubJSON.issueLabel;
      application.setProblem('invalidLabel', false);
    } else if (typeof apphubJSON.issueLabel != 'undefined') {
      application.setProblem('invalidLabel', true);
    } else {
      application.setProblem('invalidLabel', false);
    }

    return application;
  })
}

// Fetches .desktop file in repository
// Returns promise of unsaved application object
ApplicationSchema.methods.fetchDesktop = function() {
  let application = this;
  const repoName = application.github.name;
  const fullName = application.github.fullName;
  app.log.silly(`application fetchDesktop called for ${fullName}`);

  return gh.request(`GET /repos/${fullName}/contents/data/${repoName}.desktop`, {
    token: application.github.APItoken,
  })
  .catch(error => {
    if (error.status === 404) {
      application.setProblem('missingDesktop', true);
      return Promise.resolve(application);
    }
    application.setProblem('missingDesktop', false);
    return Promise.reject(`Received ${error.status} from github`);
  })
  .then(desktopData => {
    let desktopIni = {};
    try {
      const desktopBase = new Buffer(desktopData.content, 'base64');
      desktopIni = ini.parse(desktopBase.toString());
    } catch (error) {
      application.setProblem('unparsableDesktop', true);
      return Promise.resolve(application);
    }
    application.setProblem('unparsableDesktop', false);

    if (typeof desktopIni['Desktop Entry'].Name === 'string') {
      application.name = desktopIni['Desktop Entry'].Name;
    }

    if (typeof desktopIni['Desktop Entry'].Icon === 'string') {
      application.icon.name = desktopIni['Desktop Entry'].Icon;
    }

    return application;
  })
}

// Fetches app icon in repository
// Returns promise of unsaved application object
ApplicationSchema.methods.fetchIcon = function() {
  let application = this;
  const repoName = application.github.name;
  const fullName = application.github.fullName;
  app.log.silly(`application fetchIcon called for ${fullName}`);

  return gh.request(`GET /repos/${fullName}/contents/icons/64/${repoName}.svg`, {
    token: application.github.APItoken,
  })
  .catch(error => {
    if (error.status === 404) {
      application.setProblem('missingIcon', true);
      return Promise.resolve(application);
    }
    application.setProblem('missingIcon', false);
    return Promise.reject(`Received ${error.status} from github`);
  })
  .then(iconData => {
    application.icon.data = iconData.content;

    return application;
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
  .then(application => application.fetchApphub())
  .then(application => application.fetchDesktop())
  .then(application => application.fetchIcon())
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

// Application creation and exportation
var Application = mongoose.model('application', ApplicationSchema);

export { ApplicationSchema, Application };
