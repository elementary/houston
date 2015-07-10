import mongoose from 'mongoose';

import app from 'houston/app';
import CONFIG from 'houston/config.json';

mongoose.connect(CONFIG.MONGODB_URL);

mongoose.connection.on(
  'error',
  console.error.bind(console, 'connection error:')
);
mongoose.connection.once('open', callback => {
  console.log('Successfully connected to database.');
});

export default mongoose.connection;
