import app from '~/'
import { Application } from '~/model/application'

app.post('/jenkins-hook/' + app.config.jenkins.secret, function (req, res) {
  Application.updateBuild(req.body.build)
    .then(function () {
      res.end('ok')
    })
})
