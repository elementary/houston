import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github';

import app from '~/';
import { User } from '~/model/user';

// Passport setup
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
    clientID: app.config.github.clientID,
    clientSecret: app.config.github.secret,
    callbackURL: app.config.github.callback,
  }, (accessToken, refreshToken, profile, done) => {
    User.updateOrCreate(accessToken, profile)
      .then(user => {
        done(null, user);
      }, err => {
        done(err);
      });
  }
));

app.use(passport.initialize());
app.use(passport.session());

// Express routes for authentication
// Redirect to GitHub to login
app.get('/auth/github',
  passport.authenticate('github', { scope: 'repo read:org' }),
    function(req, res) {
      // Just a redirect, no actions here.
    });

// GitHub Login callback
// TODO: Add failure redirect
app.get('/auth/github/callback',
  passport.authenticate('github'),
    function(req, res) {
      res.redirect('/dashboard');
    });

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

// Convienience functions for authentication in express
export function loggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.redirect('/auth/github');
}

export function isBeta(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/github');
  }

  if (!app.config.rights.enabled || req.user.rights === 'beta') {
    return next();
  }

  return res.render('error', {
    message: 'Houston is currently only available to beta testers',
  });
}

export function isReviewer(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/github');
  }

  if (!app.config.rights.enabled || req.user.rights === 'reviewer') {
    return next();
  }

  return res.render('error', {
    message: 'Only app reviewers are allowed to do this',
  });
}

export function isAdmin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/github');
  }

  if (!app.config.rights.enabled || req.user.rights === 'admin') {
    return next();
  }

  return res.render('error', {
    message: 'Only admins are allowed to do this',
  });
}
