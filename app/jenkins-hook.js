import app from 'houston/app';
import { Project } from 'houston/app/models/project';
import CONFIG from 'houston/config.json';

app.post('/jenkins-hook/' + CONFIG.JENKINS_SECRET, function(req, res) {
  Project.updateBuild(req.body.build)
    .then(function() {
      res.end('ok');
    });
});
