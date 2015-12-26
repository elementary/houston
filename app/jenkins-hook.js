import app from '~/';
import { Application } from '~/models/application';

app.post('/jenkins-hook/' + CONFIG.JENKINS_SECRET, function(req, res) {
  Application.updateBuild(req.body.build)
    .then(function() {
      res.end('ok');
    });
});
