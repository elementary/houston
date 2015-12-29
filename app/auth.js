import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github';

import app from '~/';
import { User } from '~/models/user';

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
    clientID: CONFIG.GITHUB_CLIENT_ID,
    clientSecret: CONFIG.GITHUB_CLIENT_SECRET,
    callbackURL: CONFIG.GITHUB_CALLBACK,
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

// Export some convienience functions
export function loggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/github');
}

export function isBeta(req, res, next) {
  if (req.isAuthenticated() &&
     (!CONFIG.RIGHTS_ENABLED ||
      req.user.rights === 'beta')) {
    return next();
  }
  return res.render('error', {
    message: 'Houston is currently only available to beta testers',
  });
}

export function isReviewer(req, res, next) {
  if (req.isAuthenticated() &&
     (!CONFIG.RIGHTS_ENABLED ||
      req.user.rights === 'reviewer')) {
    return next();
  }
  return res.render('error', {
    message: 'Only app reviewers are allowed to do this',
  });
}

export function isAdmin(req, res, next) {
  if (req.isAuthenticated() &&
     (!CONFIG.RIGHTS_ENABLED ||
      req.user.rights === 'admin')) {
    return next();
  }
  return res.render('error', {
    message: 'Only admins are allowed to do this',
  });
}
