var app = require.main.require('./app');
var auth = require.main.require('./app/auth');
var Hubkit = require('hubkit');
var _ = require('underscore');

var gh = new Hubkit({});

app.get('/dashboard', auth.loggedIn, function(req, res, next) {
  // Get the repositories the user owns or is a member of
  gh.request('GET /user/repos', {
    token: req.user.github.accessToken,
    type: 'member',
  })
  .then(function(repos) {
    res.render('dashboard', {
      user: req.user,
      repos: repos,
      title: 'Dashboard',
    });
  }, next);
});
