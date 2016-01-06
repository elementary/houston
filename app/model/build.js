// Imports for packages
import mongoose from 'mongoose';
import Promise from 'bluebird';

// Local imports
import app from '~/';

// Mongoose schema for builds
const BuildSchema = mongoose.Schema({
  arch:       String,
  target:     String,
  version:    String,
  started: {
    type:     Date,
    default:  Date.now(),
  },
  finished:   Date,
  status: {
    type:     String,
    default: 'QUEUED',
  },
  log:        String,
});

// Saves application with updated build information
// Returns promise of saved application
BuildSchema.methods.nestSave = function() {
  let build = this;
  let release = build.parent();
  let application = release.parent();

  return new Promise((resolve, reject) => {
    application.save((error, application) => {
      if (error) {
        return reject(error);
      }

      return resolve(application);
    });
  });
}

// Updates build information from data
// Returns promise of saved application
BuildSchema.methods.update = function(data) {
  let build = this;
  app.log.silly(`build update called for ${build._id}`);

  if (data.status === 'FINALIZED') {
    build.status = data.status;
  } else if (data.phase === 'STARTED') {
    build.status = 'BUILDING';
  }

  if (data.status === 'FAILED') {
    return Jenkins.getLogs(data.number)
    .then(log => {
      build.log = log;
      return build.nestSave()
      .catch(error => {
        return Promise.reject(error)
      });
    });
  }

  return build.nestSave()
  .catch(error => {
    return Promise.reject(error)
  });
}

// Build export
export { BuildSchema };
