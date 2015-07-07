import mongoose from 'mongoose';

import app from './index.js';
const config = require('../config.json');

mongoose.connect(config.MONGODB_URL);

mongoose.connection.on(
  'error',
  console.error.bind(console, 'connection error:')
);
mongoose.connection.once('open', callback => {
  console.log('Successfully connected to database.');
});

export default mongoose.connection;
