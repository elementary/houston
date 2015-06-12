var app = require.main.require('./app');
var Project = require.main.require('./app/models/project').Model;
var CONFIG = require.main.require('./config');

var testData = { name: 'deb-new-test',
  url: 'job/deb-new-test/',
  build:
   { full_url: 'http://jenkins.elementaryos.org/job/deb-new-test/97/',
     number: 97,
     phase: 'STARTED',
     url: 'job/deb-new-test/97/',
     scm: {},
     parameters:
      { PACKAGE: 'debian-test-package',
        DIST: 'trusty',
        ARCH: 'amd64',
        VERSION: '2.3.1',
        REPO: 'git://github.com/elementary/debian-test-package.git' },
     log: '',
     artifacts: {} } };


app.get('/jenkins-hook/' + CONFIG.JENKINS_SECRET, function(req, res) {
  Project.updateBuild(testData.build)
    .then(function() {
      res.end('ok');
    });
});

app.post('/jenkins-hook/' + CONFIG.JENKINS_SECRET, function(req, res) {
  Project.updateBuild(req.body.build)
    .then(function() {
      res.end('ok');
    });
});
