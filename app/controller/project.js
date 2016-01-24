import app from '~/';
import { Application } from '~/model/application';
import { hasRole } from './auth';

// Manually trigger a jenkins build job
app.get('/project/gh/:org/:name/build', hasRole('beta'), (req, res, next) => {
  Application.findOne({
    'github.owner': req.params.org,
    'github.name': req.params.name,
  })
  .then(application => application.release.latest.buildDo())
  .then(application => {
    res.redirect('/dashboard');
  });
});

// Delete the project from houston
app.get('/project/gh/:org/:name/delete', hasRole('beta'), function(req, res) {
  Application.findOne({
    'github.owner': req.params.org,
    'github.name': req.params.name,
  })
  .then(application => {
    application.remove();
    res.redirect('/dashboard');
  });
});
