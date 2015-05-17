var app = require.main.require('./app');
var Project = require.main.require('./app/models/project').Project;
var auth = require.main.require('./app/auth');
var _ = require('underscore');

app.get('/project/gh/:org/:name', auth.loggedIn, function(req, res) {
  Project.findOrCreateGitHub(req.params.org, req.params.name, req.user)
    .then(function(repo) {
      console.log('moep moep');
      res.render('project', {
        project: repo,
      });
    }, function(err) {
      console.log('err', err);
      throw err;
    });
});
