import app from '~/';
import { Application } from '~/model/application';
import { isBeta } from './auth';

// Manually trigger a jenkins build job
app.get('/project/gh/:org/:name/build', isBeta, (req, res, next) => {
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
app.get('/project/gh/:org/:name/delete', isBeta, function(req, res) {
  Application.findOne({
    'github.owner': req.params.org,
    'github.name': req.params.name,
  })
  .then(application => {
    application.remove();
    res.redirect('/dashboard');
  });
});
