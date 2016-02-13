#!/usr/bin/env node
import fs from 'fs';
import express from 'express';
import exphbs from 'express-handlebars';
import path from 'path';
import favicon from 'serve-favicon';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import expressWinston from 'express-winston';
import Winston from 'winston';
import mongoose from 'mongoose';
import session from 'express-session';
let MongoStore = require('connect-mongo')(session);

/**
 * Start an app object
 */
let app = module.exports = express();

/**
 * Setup app configuration
 */
app.config = {}

try {
  fs.statSync(path.join(__dirname, '../config.js'));
} catch (err) {
  throw new Error('It seems like you have not setup houston, we have a example config file for you, please set it up.');
}

app.config = require(path.join(__dirname, '../config.js'));

app.config.env = process.env.NODE_ENV || 'development';

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
 * Initialize database connection
 */
mongoose.connect(app.config.database.url);

mongoose.connection.on('error', msg => {
  throw new Error(msg);
});

mongoose.connection.once('open', () => {
  app.log.info('Connected to database');
});

/**
 * Setup handlebars
 */
app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  helpers: require(path.join(__dirname, '../views/helpers.js')),
}));
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
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
  }),
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
  process.on('unhandledRejection', (reason, p) => {
    if (reason != null) {
      app.log.warn('Possible unhandled promise rejection');
      app.log.warn(reason);
    }
  });
}

/**
 * Catch 404 errors
 */
app.use((req, res, next) => {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/**
 * Setup 500 error pages
 */
if (app.config.env === 'development') {
  app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.render('error', {
      message: error.message,
      error,
    });
  });
}

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
  });
});
