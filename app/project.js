var app = require.main.require('./app');
var Project = require.main.require('./app/models/project').Model;
var auth = require.main.require('./app/auth');
var _ = require('underscore');

// Show project information
app.get('/project/gh/:org/:name', auth.loggedIn, function(req, res, next) {
  Project.findOrCreateGitHub(req.params.org, req.params.name, req.user)
  .then(function(project) {
    res.render('project', {
      project: project,
    });
  }, next);
});

// Manually trigger a jenkins build job
app.get('/project/gh/:org/:name/build', auth.loggedIn, function(req, res, next) {
  Project.findOrCreateGitHub(req.params.org, req.params.name, req.user)
  .then(function(project) {
    return project.doBuild();
  })
  .then(function(build) {
    res.render('json', {
      json: build,
    });
  }, next);
});
