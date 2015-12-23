#!/usr/bin/env node
require('babel-register');

CONFIG = require('./config');

var server = require('./app/server');
