var app = require.main.require('./app');
var CONFIG = require.main.require('./config');
var jenkinsClient = require('then-jenkins');

jenkins = jenkinsClient(CONFIG.JENKINS_URL);

var Jenkins = {
  doBuild: function(project, params) {
    return jenkins.job.build({
      name: CONFIG.JENKINS_JOB,
      parameters: params,
    });
  },
  getLogs: function(build) {
    return jenkins.build.log(CONFIG.JENKINS_JOB, build);
  },
};

module.exports = Jenkins;
