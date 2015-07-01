var app = require.main.require('./app');
var Project = require.main.require('./app/models/project').Model;
var CONFIG = require.main.require('./config');

app.get('/jenkins-hook/' + CONFIG.JENKINS_SECRET, function(req, res) {
  Project.updateBuild(req.body.build)
    .then(function() {
      res.end('ok');
    });
});
