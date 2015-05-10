var app = require.main.require('./app/index');
var config = require.main.require('./config');
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
        callbackURL: "http://server2.elementaryos.org:3000/auth/github/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        // To keep the example simple, the user's GitHub profile is returned to
        // represent the logged-in user.  In a typical application, you would want
        // to associate the GitHub account with a user record in your database,
        // and return that user instead.
        return done(null, profile);
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
