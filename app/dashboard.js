var app = require.main.require('./app/index.js');
var async = require('async');
var github = require('octonode');
var _ = require('underscore');

app.get('/dashboard', ensureAuthenticated, function(req, res) {
  var client = github.client(req.user.github.accessToken);
  var ghme   = client.me();

  async.parallel([
      function(callback) {
        ghme.repos(callback);
      },
      function(callback) {
        ghme.orgs(function(err, data) {
          async.map(data, function(data, cb) {
            client.org(data.login).repos(cb);
          }, callback);
        });
      },
    ],
    function(err, repos) {
      repos[0][1] = null;
      res.render('dashboard', {
        user: req.user,
        repos: _.compact(_.flatten(repos)),
      });
    }
  );
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/auth/github');
}
