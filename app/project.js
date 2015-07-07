import _ from 'underscore';

import app from './index.js';
import { Project } from './models/project';
import { loggedIn } from './auth';

// Show project information
app.get('/project/gh/:org/:name', loggedIn, function(req, res, next) {
  Project.findOrCreateGitHub(req.params.org, req.params.name, req.user)
  .then(function(project) {
    res.render('project', {
      project: project,
    });
  }, next);
});

// Manually trigger a jenkins build job
app.get('/project/gh/:org/:name/build', loggedIn, (req, res, next) => {
  Project.findOrCreateGitHub(req.params.org, req.params.name, req.user)
    .then(function(project) {
      return project.doBuild();
    })
    .then(function(build) {
      res.redirect('/project/gh/' + req.params.org + '/' + req.params.name);
    }, next);
});

// Manually regenerate changelog
app.get('/project/gh/:org/:name/changelog', loggedIn, function(req, res) {
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
app.get('/project/gh/:org/:name/delete', loggedIn, function(req, res) {
  Project.findOrCreateGitHub(req.params.org, req.params.name, req.user)
    .then(function(project) {
      project.remove();
      res.redirect('/dashboard');
    });
});
