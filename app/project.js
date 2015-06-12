var app = require.main.require('./app');
var Project = require.main.require('./app/models/project').Model;
var auth = require.main.require('./app/auth');
var _ = require('underscore');

// Show Project information
app.get('/project/gh/:org/:name', auth.loggedIn, function(req, res) {
  Project.findOrCreateGitHub(req.params.org, req.params.name, req.user)
    .then(function(project) {
      res.render('project', {
        project: project,
      });
    }, function(err) {
      console.log('Error:', err);
      throw err;
    });
});

// Do manual Build
app.get('/project/gh/:org/:name/build', auth.loggedIn, function(req, res) {
  Project.findOrCreateGitHub(req.params.org, req.params.name, req.user)
    .then(function(project) {
      return project.doBuild();
    })
    .then(function(build) {
      res.render('json', {
        json: build,
      });
    }, function(err) {
      console.log('Error:', err);
      throw err;
    });
});
