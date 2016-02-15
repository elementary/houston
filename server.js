#!/usr/bin/env node
require('babel-register');
require('babel-polyfill');
var app = require('./app');
var express = require('express');
var http = require('http');

/**
 * Run server
 */
var server = http.createServer(app);
server.listen(app.config.server.port);

/**
 * Provide console messages
 */
server.on('error', function logError() {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES': {
      app.log.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    }
    case 'EADDRINUSE': {
      app.log.error(bind + ' is already in use');
      process.exit(1);
      break;
    }
    default: {
      throw error;
    }
  }
});

server.on('listening', function logStart() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  app.log.info('Listening on ' + bind);
});
