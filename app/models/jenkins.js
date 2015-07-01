var app = require.main.require('./app');
var CONFIG = require.main.require('./config');
var jenkinsClient = require('then-jenkins');

if (CONFIG.JENKINS_ENABLED) {
  var jenkins = jenkinsClient(CONFIG.JENKINS_URL);
}

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

// If Jenkins isn't set to be enabled, export an empty object so when somebody
// tries to access it we get an intentional failure.
module.exports = CONFIG.JENKINS_ENABLED ? Jenkins : {};
