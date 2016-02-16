#!/usr/bin/env node
require('babel-register');
require('babel-polyfill');
var fs = require('fs');
var express = require('express');
var exphbs = require('express-handlebars');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var expressWinston = require('express-winston');
var Winston = require('winston');

/**
 * Start an app object
 */
var app = module.exports = express();
app.helper = require('./helpers');

/**
 * Setup app configuration
 */
app.config = {}

try {
  fs.statSync(path.join(__dirname, '../config.js'));
} catch (err) {
  throw new Error('It seems like you have not setup Houston, we have a example config file for you, please set it up.');
}

app.config = require(path.join(__dirname, '../config.js'));

app.config.env = process.env.NODE_ENV
if (app.config.env == null) {
  app.config.env = 'development'
}

/**
 * Setup winston logging
 */
app.config.log.transports = [];

if (app.config.log.console) {
  app.config.log.transports.push(
      new Winston.transports.Console({
      prettyPrint: true,
      colorize: true,
      level: app.config.log.level,
    })
  )
}

if (app.config.log.files) {
  app.config.log.transports.push(
    new Winston.transports.File({
      name: 'info-file',
      filename: 'info.log',
      level: 'info',
    })
  )
  app.config.log.transports.push(
    new Winston.transports.File({
      name: 'error-file',
      filename: 'error.log',
      level: 'error',
    })
  )
}

app.log = new Winston.Logger({
  transports: app.config.log.transports,
});
app.log.cli();

/**
 * Setup handlebars
 */
const hbsHelper = require(path.join(__dirname, '../views/helpers.js'));
app.handlebars = exphbs.create({
  defaultLayout: 'main',
  helpers: hbsHelper,
});

app.engine('handlebars', app.handlebars.engine);
app.set('view engine', 'handlebars');

/**
 * Setup middleware
 */
app.set('port', app.config.server.port);
app.use(favicon(path.join(__dirname, '../public/favicon.ico')));
app.use(expressWinston.logger({
  transports: app.config.log.transports,
  expressFormat: true,
  meta: false,
  level: 'silly',
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: app.config.server.secret,
  saveUninitialized: false, // Don't create session until something stored
  resave: false, // Don't save session if unmodified
}));
app.use(express.static('./public'));

/**
 * Access all api files
 */
app.model = require('./model');
app.controller = require('./controller');

/**
 * Log potentially unhandled promises
 */
// TODO: move over to testing suite
if (app.config.env === 'development') {
  process.on('unhandledRejection', function(reason, p) {
    if (reason != null) {
      app.log.warn('Possible unhandled promise rejection');
      app.log.warn(reason);
    }
  });
}

/**
 * Catch 404 errors
 */
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/**
 * Setup 500 error pages
 */
if (app.config.env === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
    });
  });
}

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
  });
});
