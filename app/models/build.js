var mongoose = require('mongoose');
var CONFIG = require.main.require('./config');

var BuildSchema = mongoose.Schema({
  arch:       String,
  target:     String,
  version:    String,
  started:    Date,
  finished:   Date,
  status:     String,
  log:        String,
});

module.exports = {
  Schema: BuildSchema,
};
