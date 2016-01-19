import jenkinsClient from 'then-jenkins'

import app from '~/'

if (app.config.jenkins.enabled) {
  var jenkins = jenkinsClient(app.config.jenkins.url)
}

var Jenkins = {
  doBuild: function (params) {
    if (app.config.jenkins.enabled) {
      return jenkins.job.build({
        name: app.config.jenkins.job,
        parameters: params
      }).then(buildId => params)
    } else {
      return params
    }
  },
  getLogs: function (build) {
    return jenkins.build.log(app.config.jenkins.job, build)
  }
}

export default Jenkins
