var app = require.main.require('./app/index');
var config = require.main.require('./config');
var User = require.main.require('./app/models/user').User;
var passport = require('passport');
var GitHubStrategy = require('passport-github').Strategy;


// TODO: Serialize User for sessions
passport.serializeUser(function(user, done) {
  done(null, user);
});

// TODO: Deserialize User for sessions
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Define GitHub Login Strategy
passport.use(new GitHubStrategy({
    clientID: config.GITHUB_CLIENT_ID,
    clientSecret: config.GITHUB_CLIENT_SECRET,
    callbackURL: 'http://server2.elementaryos.org:3000/auth/github/callback',
  },
  // TODO: Pretty up this Promise part
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreateGitHub(accessToken, refreshToken, profile)
      .then(function(user) {
        done(null, user);
      }, function(err) {
        done(err);
      });
  }
));

app.use(passport.initialize());
app.use(passport.session());

// Redirect to GitHub to login
app.get('/auth/github',
    passport.authenticate('github', { scope: 'repo' }),
    function(req, res) {
      // Just a redirect, no actions here.
    });

// GitHub Login callback
// TODO: Add failure redirect
app.get('/auth/github/callback',
    passport.authenticate('github'),
    function(req, res) {
      // Send Users to the Dashboard after login
      res.redirect('/dashboard');
    });

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

// Export some convienience functions
module.exports = {
  loggedIn: function(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/auth/github');
  },
};
