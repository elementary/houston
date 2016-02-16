import Promise from 'bluebird';
import Hubkit from 'hubkit';

import app from '~/';
import { Application } from '~/model/application';
import { hasRole } from './auth';

// Delete the project from Houston
app.get('/project/gh/:org/:name/initialize', hasRole('beta'), function(req, res) {
  return Application.findOne({
    'github.owner': req.params.org,
    'github.name': req.params.name,
  })
  .then(application => {
    if (!application) {
      return res.view('error', new Error('Unable to find application'));
    }

    return application.fetchGithub();
  })
  .then(() => res.redirect('/dashboard'));
});

// Manually trigger a jenkins build job
app.get('/project/gh/:org/:name/build', hasRole('beta'), (req, res, next) => {
  Application.findOne({
    'github.owner': req.params.org,
    'github.name': req.params.name,
  })
  .then(application => {
    if (!application) {
      return res.view('error', new Error('Application not found'));
    }

    if (!application.initalized) {
      return res.redirect('/dashboard');
    }

    application.release.latest.buildDo();
    return res.redirect('/dashboard');
  });
});

// Delete the project from Houston
app.get('/project/gh/:org/:name/delete', hasRole('beta'), function(req, res) {
  Application.findOne({
    'github.owner': req.params.org,
    'github.name': req.params.name,
  })
  .then(application => {
    if (!application) {
      return res.view('error', new Error('Application not found'));
    }

    application.remove();
    res.redirect('/dashboard');
  });
});
