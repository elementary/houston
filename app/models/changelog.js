var mongoose = require('mongoose');
var CONFIG = require.main.require('./config');

var ChangeLogSchema = mongoose.Schema({
  version:    String,
  author:     String,
  date:       Date,
  items:      [String],
});

module.exports = {
  Schema: ChangeLogSchema,
};
