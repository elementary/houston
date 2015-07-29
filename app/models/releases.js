import mongoose from 'mongoose';
import Jenkins from 'houston/app/models/jenkins';

const ReleasesSchema = mongoose.Schema({
  version:    String,
  author:     String,
  date:       Date,
  items:      [String],
  status:     { type: String, default: 'NEW RELEASE', enum: [
    'NEW RELEASE', 'BUILDING', 'REVIEWING', 'FAILED', 'SUCCESS',
  ], },
  tag:        String,
  builds:     [ {
    arch:       String,
    target:     String,
    started:    Date,
    finished:   Date,
    status:     String,
    log:        String,
  }, ],
});

ReleasesSchema.methods.doBuild = function() {
  let params = [];
  const application = this.ownerDocument();
  for (let i = 0; i < application.dists.length; i++) {
    const archAndDist = application.dists[i].split('-');
    params.push({
      PACKAGE:   application.package ? application.package : application.github.name,
      REPO:      application.github.repoUrl,
      VERSION:   this.version,
      DIST:      archAndDist[0],
      ARCH:      archAndDist[1],
      REFERENCE: this.tag,
      IDENTIFIER: `${application._id}#${this._id}#`,
    });
  }
  return Promise.all(ApplicationSchema.statics.debianChangelog(application, params))
    .map(params => {
      // Insert a new Build into the Project DB
      const i = this.builds.push({
        arch:       params.ARCH,
        target:     params.DIST,
        status:     'QUEUED',
      });
      params.IDENTIFIER += this.builds[i - 1]._id;
      return params;
    })
    .map(Jenkins.doBuild)
    .then(builds => {
      application.status = 'BUILDING';
      return application.save();
    });
}

ReleasesSchema.methods.updateBuild = function(buildId, data) {
  const build = this.id(buildId);
  if (data.phase === 'FINALIZED') {
    // We are done with this build, let's update the DB
    build.status = data.status;
    if (data.status === 'FAILED') {
      // It failed, so let's get the Buildlog
      return Jenkins.getLogs(data.number)
      .then(function(log) {
        build.log = log;
        return this;
      });
    } else {
      return this;
    }
  } else if (data.phase === 'STARTED') {
    // Jenkins started building this Build, let's update the DB
    build.status = 'BUILDING';
    return this;
  }
}

export { ReleasesSchema };
