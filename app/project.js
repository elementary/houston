import app from '~/';
import { Application } from '~/models/application';
import { loggedIn } from '~/auth';

// Manually trigger a jenkins build job
app.get('/project/gh/:org/:name/build', loggedIn, (req, res, next) => {
  Application.findOne({
    'github.owner': req.params.org,
    'github.name': req.params.name,
  })
  .then(application => {
    const iteration = application.releases[application.releases.length - 1];
    return iteration.doBuild();
  })
  .then(build => res.redirect('/dashboard'), next);
});

// Delete the project from houston
app.get('/project/gh/:org/:name/delete', loggedIn, function(req, res) {
  Application.findOne({
    'github.owner': req.params.org,
    'github.name': req.params.name,
  })
  .then(application => {
    application.remove();
    res.redirect('/dashboard');
  });
});
