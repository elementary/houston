var mongoose = require('mongoose');
var Hubkit = require('hubkit');
var CONFIG = require.main.require('./config');
var Jenkins = require.main.require('./app/models/jenkins');
var BuildSchema = require.main.require('./app/models/build').Schema;
var ChangeLogSchema = require.main.require('./app/models/changelog').Schema;

// Create an instance of Hubkit
var gh = new Hubkit({});

var ProjectSchema = mongoose.Schema({
  source:     String,
  name:       String,
  package:    String,
  repoUrl:    String,
  version:    String,
  keysSetup:  Boolean,
  hookSetup:  Boolean,
  builds:     [BuildSchema],
  changelog:  [ChangeLogSchema],
});

/* Create the Project if it does not exist,
 * needs user data for private GH repos */
ProjectSchema.statics.findOrCreateGitHub = function(org, reponame, user) {
  var self = this;
  return self.findOne({name: org + '/' + reponame, source: 'github'}).exec()
    .then(function(repo) {
      if (repo) {
        return repo;
      } else {
        return gh.request('GET /repos/' + org + '/' + reponame,
          {token: user.github.accessToken})
          .then(function(repoData) {
            return self.create({
              source:     'github',
              name:       org + '/' + reponame,
              package:    reponame,
              repoUrl:    repoData.git_url,
              keysSetup:  false,
              hookSetup:  false,
            });
          });
      }
    });
};

ProjectSchema.statics.updateBuild = function(data) {
  var self = this;
  return self.findOne(
    {
      builds: {
        $elemMatch: {
          arch:    data.parameters.ARCH,
          target:  data.parameters.DIST,
          version: data.parameters.VERSION,
        },
      },
    }).exec()
    .then(function(project) {
      for (var build in project.builds) {
        if (project.builds[build].arch    === data.parameters.ARCH &&
            project.builds[build].target  === data.parameters.DIST &&
            project.builds[build].version === data.parameters.VERSION) {
          switch (data.phase) {
            case 'FINALIZED': {
              // TODO: Implement notifications for builds
              return Jenkins.getLogs(data.number)
                .then(function(log) {
                  project.builds[build].status = data.status;
                  project.builds[build].log = log;
                  return project.save();
                });
              break;
            }
            case 'STARTED': {
              project.builds[build].status = 'BUILDING';
              return project.save();
              break;
            }
          }
        }

      }
    });
};


ProjectSchema.methods.doBuild = function(params) {
  var self = this;
  if (!params) {
    params = {
      PACKAGE: self.package,
      VERSION: '2.3.1', // TODO: change once we have changelogs
      REPO:    self.repoUrl,
      ARCH:    'amd64', // TODO: iterate over enabled archs
      DIST:    'trusty', // TODO: iterate over enabled dists
    }
  }
  return Jenkins.doBuild(self, params)
    .then(function(buildId) {
      // Insert a new Build into the Project DB
      self.builds.push({
        arch:       params.ARCH,
        target:     params.DIST,
        version:    params.VERSION,
        status:     'QUEUED',
      });
      return self.save();
    });
}

ProjectSchema.pre('save', function(next) {
  // TODO: Limit kept build results to some number set in CONFIG
  next();
});

var Project = mongoose.model('project', ProjectSchema);

module.exports = {
  Schema: ProjectSchema,
  Model:  Project,
};
