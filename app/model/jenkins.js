// Imports for packages
import jenkinsClient from 'then-jenkins';

// Local Imports
import app from '~/';

// Global instances
if (app.config.jenkins.enabled) {
  const jenkins = jenkinsClient(app.config.jenkins.url);
}

function doBuild(params) {
  if (app.config.jenkins.enabled) {
    return jenkins.job.build({
      name: app.config.jenkins.job,
      parameters: params,
    }).then(buildId => params);
  }

  return params;
}

function getLogs(build) {
  if (app.config.jenkins.enabled) {
    return jenkins.build.log(app.config.jenkins.job, build);
  }

  return 'Jenkins is currently disabled';
}

export default { doBuild, getLogs }
