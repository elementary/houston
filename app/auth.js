var app = require.main.require('./app/index');
var config = require.main.require('./config');
var User = require.main.require('./app/models/user').User;
var passport = require('passport');
var GitHubStrategy = require('passport-github').Strategy;


// Serialize User for sessions
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Define GitHub Login Strategy
passport.use(new GitHubStrategy({
    clientID: config.GITHUB_CLIENT_ID,
    clientSecret: config.GITHUB_CLIENT_SECRET,
    callbackURL: 'http://server2.elementaryos.org:3000/auth/github/callback',
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({username: profile.username}, {
      username: profile.username,
      email:    profile.emails[0].value,
      avatar:   profile._json.avatar_url,
      github:   {accessToken: accessToken, refreshToken: refreshToken},
      joined:   Date.now(),
      active:   true,
    }, function(err, user, created) {
      return done(null, user);
    });
  }
));


app.use(passport.initialize());
app.use(passport.session());


// Redirect to GitHub to login
app.get('/auth/github',
    passport.authenticate('github', { scope: 'repo' }),
    function(req, res) { });

// GitHub Login callback
app.get('/auth/github/callback',
    passport.authenticate('github', {failureRedirect: '/loginerror'}),
    function(req, res) {
      res.redirect('/dashboard');
    });

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});
