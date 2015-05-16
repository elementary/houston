var app = require.main.require('./app');
var auth = require.main.require('./app/auth');
var Hubkit = require('hubkit');
var _ = require('underscore');

// Create an instance of Hubkit
var gh = new Hubkit({});

app.get('/dashboard', auth.loggedIn, function(req, res) {
  // Get the repositories the User has access to
  var repos = [
    gh.request('GET /user/repos', {token: req.user.github.accessToken}),
    gh.request('GET /user/orgs', {token: req.user.github.accessToken})
      .then(function(orgs) {
        // Map each Org to their repos
        return Promise.all(orgs.map(function(org) {
          return gh.request('GET /orgs/' + org.login + '/repos',
            {token: req.user.github.accessToken});
        }));
      }),
  ];
  // Combine these Promises back together and render the output
  Promise.all(repos).then(function(repos) {
    res.render('dashboard', {
      user: req.user,
      repos: _.compact(_.flatten(repos)),
    });
  }).catch(function(err) {
    console.log('Error', err);
    throw err;
  });
});
