import app from './index.js';
import { Project } from './models/project';
const config = require('../config.json');

app.post('/jenkins-hook/' + config.JENKINS_SECRET, function(req, res) {
  Project.updateBuild(req.body.build)
    .then(function() {
      res.end('ok');
    });
});
