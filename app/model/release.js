// Imports for packages
import mongoose from 'mongoose';
import Promise from 'bluebird';
import semver from 'semver';

// Local imports
import app from '~/'
import Jenkins from './jenkins';
import IssueSchema from './issue';
import { BuildSchema } from './build';

// Mongoose schema for releases
const ReleaseSchema = mongoose.Schema({
  github: {                 // All Github communication data
    id:       Number,       // Id for Github API
    author:   String,       // Github user login
    date:     Date,         // Github publish date
    tag:      String,       // Github uncleaned tag (v4.2.3)
  },
  status: {                 // Build status
    type:     String,
    default: 'NEW RELEASE',
    enum:   ['NEW RELEASE', 'BUILDING', 'REVIEWING', 'SUCCESS', 'FAILED'],
  },
  changelog: [String],      // List of changelog items for release
  issue:      IssueSchema , // Current Github issue for release
  problems: [{              // All release problems
    type:     String,
    enum: [
      'missingChangelog',   // Missing changelog in GitHub release
    ],
  },],
  builds:    [BuildSchema],
});

// Make all virtual properties show up in toJSON
ReleaseSchema.set('toJSON', { virtuals: true });

// Release virtual properties
ReleaseSchema.virtual('build.latest').get(function() {
  return this.builds[this.builds.length - 1];
});

ReleaseSchema.virtual('version').get(function() {
  if (this.github.tag != null) {
    return semver.clean(this.github.tag, true);
  }

  return '0.0.0';
});

// Release methods
// Helper function for release problems
// Returns a boolean always
ReleaseSchema.methods.hasProblem = function(query) {
  return _.indexOf(this.problems, query) >= 0;
}

// Sets an release problem based on status or toggles if no status
// Returns nothing
ReleaseSchema.methods.setProblem = function(query, status = !this.hasProblem(query)) {
  if (status && !this.hasProblem(query)) {
    this.problems.push(query);
  } else if (!status && this.hasProblem(query)) {
    this.problems = _.pull(this.problems, query);
  }
}

// TODO: refactor, add some changelog logic to buildDo function
// Sends build information to Jenkins
// Returns promise of saved application object
ReleaseSchema.methods.buildDo = function() {
  const release = this;
  const application = release.ownerDocument();
  app.log.silly(`release buildDo called for ${application.github.fullName}#${release.version}`);

  let params = [];
  for (let i = 0; i < application.dists.length; i++) {
    const distAndArch = application.dists[i].split('-');

    params.push({ // Data sent to Jenkins for build
      PACKAGE:    application.github.name,
      REPO:       application.github.repoUrl,
      VERSION:    release.version,
      DIST:       distAndArch[0],
      ARCH:       distAndArch[1],
      REFERENCE:  release.github.tag,
      IDENTIFIER: `${application._id}#${release._id}#`,
    });
  }

  return Promise.all(application.changelog(params))
  .map(param => {
    const length = release.builds.push({ // Create new build in database
      arch: param.arch,
      target: param.dist,
    });
    param.IDENTIFIER += release.builds[length - 1]._id; // Add database build id to Jenkin Params
    return param;
  })
  .map(Jenkins.doBuild) // Send the params to Jenkins for building
  .then(data => {
  })
  .catch(error => {
    return Promise.reject(error);
  })
  .then(builds => {
    release.status = 'BUILDING'; // Update release to 'BUILDING' status
    return application.save();
  });
}

// Grabs release changelog from Github
// Returns promise of unsaved release object
ReleaseSchema.methods.changelogFetch = function() {
  const release = this;
  const application = release.ownerDocument();
  app.log.silly(`release changelogFetch called for ${application.github.fullName}#${release.version}`);

  return gh.request(`GET /repos/${application.github.fullName}/releases/${release.github.id}`, {
    token: application.github.APItoken,
  })
  .catch(error => {
    return Promise.reject(`Received ${error.status} from github`);
  })
  .then(githubRelease => {
    let githubChangelog = githubRelease.body.match(/.+/g);

    if (githubChangelog.length <= 0) {
      this.setProblem('missingChangelog', true);
    } else {
      release.changelog = githubChangelog;
    }

    return release;
  });
}

export default ReleaseSchema;
