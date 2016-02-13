import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github';

import app from '~/';
import { UserSchema, User } from '~/model/user';

// Passport setup
passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(error, user) {
    done(error, user);
  });
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
  passport.authenticate('github', {
    scope: 'repo read:org',
  }), (req, res, next) => {
    return next(); // Never gets called because of redirect to GitHub
  }
);

// GitHub Login callback
// TODO: Add failure redirect
app.get('/auth/github/callback',
  passport.authenticate('github'),
  (req, res, next) => {
    const path = req.session.authredirect || '/dashboard';
    req.session.authredirect = null; // Avoid redirection loops
    return res.redirect(path);
  }
);

app.get('/logout', function(req, res) {
  const path = req.session.authredirect || '/';
  req.session.authredirect = null; // Avoid redirection loops
  req.logout();
  return res.redirect(path);
});

// Convienience functions for authentication in express
// Checks if the user is logged In
export function loggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  req.session.authredirect = req.originalUrl; // Set destination url
  return res.redirect('/auth/github');
}

// Checks if user has rights, given permission string or index
export function hasRole(permission) {
  // Turn a number into string based on user rights index
  if (typeof permission === 'number') {
    permission = UserSchema.tree.rights.enum[permission];
  }

  // Check for any routes with unknown permissions
  // Logs error on startup, and every time the route is called
  if (UserSchema.tree.rights.enum.indexOf(permission) === -1) {
    app.log.error(`detected an invalid "${permission}" permission!`);
    return function(req, res, next) {
      app.log.error(`${req.path} has an invalid "${permission}" permission requirement`);
      return res.render('error', {
        message: `Houston is currently only available to rabbit lovers`,
      });
    }
  }

  // Return function
  return function(req, res, next) {
    if (!req.isAuthenticated()) {
      req.session.authredirect = req.originalUrl; // Set destination url
      return res.redirect('/auth/github');
    }

    if (!app.config.rights.enabled || req.user.rights === permission) {
      return next();
    }

    if (permission === 'beta') {
      return res.render('error', {
        message: `Houston is currently only available to beta testers`,
      })
    }

    return res.render('error', {
      message: `Only ${permission}s are allowed`,
    });
  }
}
