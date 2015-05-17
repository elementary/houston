var app = require.main.require('./app/index');
var config = require.main.require('./config');

var mongoose = require('mongoose');
mongoose.connect(config.MONGODB_URL);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(callback) {
  console.log('Successfully connected to database.');
});

module.exports = db;
