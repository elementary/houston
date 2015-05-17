var mongoose = require('mongoose');
var Hubkit = require('hubkit');
var CONFIG = require.main.require('./config');

// Create an instance of Hubkit
var gh = new Hubkit({});

var BuildSchema = mongoose.Schema({
  buildId:    String,
  target:     String,
  started:    Date,
  finished:   Date,
  status:     String,
  log:        String,
});

var ProjectSchema = mongoose.Schema({
  source:     String,
  name:       String,
  repoUrl:    String,
  version:    String,
  keysSetup:  Boolean,
  hookSetup:  Boolean,
  builds:     [BuildSchema],
});

/* Create the Project if it does not exist,
 * needs user data for private GH repos */
ProjectSchema.statics.findOrCreateGitHub = function(org, reponame, user) {
  var self = this;
  return self.findOne({name: org + '/' + reponame}).exec()
    .then(function(repo) {
      if (repo) {
        return repo;
      } else {
        return gh.request('GET /repos/' + org + '/' + reponame,
          {token: user.github.accessToken})
          .then(function(repoData) {
            return self.create({
              source:     'github',
              name:       reponame,
              repoUrl:    repoData.git_url,
              keysSetup:  false,
              hookSetup:  false,
            });
          });
      }
    });
};

ProjectSchema.pre('save', function(next) {
  // TODO: Limit kept build results to some number set in CONFIG
  next();
});

var Project = mongoose.model('project', ProjectSchema);

module.exports = {ProjectSchema: ProjectSchema, Project: Project};
