import express from 'express';
import exphbs from 'express-handlebars';
import path from 'path';
import favicon from 'serve-favicon';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
// TODO: Not sure how to express (ha, pun) this idiom with ES6 modules
let MongoStore = require('connect-mongo')(session);

import mongooseConnection from '~/mongodb';

// Initialize Application
let app = express();
export default app;

// Setup Handlebars Templates
import * as HandlebarHelpers from './handlebars-helpers';
app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  helpers: HandlebarHelpers,
}));
app.set('view engine', 'handlebars');

// Initialize Middleware
app.use(favicon(path.join(__dirname, '../public/favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: CONFIG.SESSION_SECRET,
  saveUninitialized: false, // Don't create session until something stored
  resave: false, // Don't save session if unmodified
  store: new MongoStore({
    mongooseConnection: mongooseConnection,
  }),
}));
app.use(express.static(path.join(__dirname, '../public')));

// Setup routes
// TODO: Not sure how to idiomatically port this to ES6-modules;
require.main.require('./app/home');
require.main.require('./app/auth');
require.main.require('./app/dashboard');
require.main.require('./app/jenkins-hook');
require.main.require('./app/project');

// Catch 404 Errors
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Development error handler: will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
    });
  });
}

// Production error handler: no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
  });
});
