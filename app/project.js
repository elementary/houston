import _ from 'underscore';

import app from 'houston/app';
import { Application } from 'houston/app/models/project';
import { loggedIn } from 'houston/app/auth';

// Show project information
app.get('/project/gh/:org/:name', loggedIn, function(req, res, next) {
  Application.findOne({
    'github.owner':  req.params.org,
    'github.name':   req.params.name,
  })
  .then(function(project) {
    res.render('project', {
      project: project,
    });
  }, next);
});

// Manually trigger a jenkins build job
app.get('/project/gh/:org/:name/build', loggedIn, (req, res, next) => {
  Application.findOne({
    'github.owner':  req.params.org,
    'github.name':   req.params.name,
  })
  .then(function(application) {
    return Application.doBuild(application);
  })
  .then(function(build) {
    res.redirect('/dashboard');
  }, next);
});

// Manually regenerate changelog
app.get('/project/gh/:org/:name/changelog', loggedIn, function(req, res) {
  Application.findOne({
    'github.owner':  req.params.org,
    'github.name':   req.params.name,
  })
  .then(function(application) {
    // Generate Debian Changelog
    return Application.debianChangelog(application);
  })
  .then(function(changelog) {
    res.render('print', {
      lines: changelog,
    });
  });
});

// Delete the project from houston
app.get('/project/gh/:org/:name/delete', loggedIn, function(req, res) {
  Application.findOne({
    'github.owner':  req.params.org,
    'github.name':   req.params.name,
  })
  .then(function(project) {
    project.remove();
    res.redirect('/dashboard');
  });
});
