import app from 'houston/app';
import { Application } from 'houston/app/models/application';
import CONFIG from 'houston/config.json';

app.post('/jenkins-hook/' + CONFIG.JENKINS_SECRET, function(req, res) {
  Application.updateBuild(req.body.build)
    .then(function() {
      res.end('ok');
    });
});
