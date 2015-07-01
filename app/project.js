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
app.get('/project/gh/:org/:name/build', auth.loggedIn, (req, res, next) => {
  Project.findOrCreateGitHub(req.params.org, req.params.name, req.user)
    .then(function(project) {
      return project.doBuild();
    })
    .then(function(build) {
      res.redirect('/project/gh/' + req.params.org + '/' + req.params.name);
    }, next);
});

// Manually regenerate changelog
app.get('/project/gh/:org/:name/changelog', auth.loggedIn, function(req, res) {
  Project.findOrCreateGitHub(req.params.org, req.params.name, req.user)
    .then(function(project) {
      if (project.changelog.length === 0) {
        return project.generateGitHubChangelog();
      } else {
        return project;
      }
    })
    .then(function(project) {
      // Generate Debian Changelog
      return project.debianChangelog({
        DIST: 'trusty',
      });
    })
    .then(function(params) {
      res.render('print', {
        lines: params.CHANGELOG,
      });
    });
});

// Delete the project from houston
app.get('/project/gh/:org/:name/delete', auth.loggedIn, function(req, res) {
  Project.findOrCreateGitHub(req.params.org, req.params.name, req.user)
    .then(function(project) {
      project.remove();
      res.redirect('/dashboard');
    });
});
