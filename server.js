#!/usr/bin/env node
require('babel-register');
require('babel-polyfill');

CONFIG = require('./config');

var server = require('./app/server');
