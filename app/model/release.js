import mongoose from 'mongoose';
import Promise from 'bluebird';
import semver from 'semver';

import app from '~/'
import Jenkins from './jenkins';
import IssueSchema from './issue';
import { BuildSchema } from './build';

const ReleaseSchema = new mongoose.Schema({
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
  appHooks: {               // Storage of appHook GitHub issues
    type:     Object,
    default:  {},
  },
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

// TODO: refactor, add some changelog logic to buildDo function
// Sends build information to Jenkins
// Returns promise of saved application object
ReleaseSchema.methods.buildDo = function() {
  const release = this;
  const application = release.ownerDocument();
  app.log.silly(`Building ${application.github.fullName}#${release.version}`);

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

export default ReleaseSchema;
