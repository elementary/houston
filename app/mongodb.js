import mongoose from 'mongoose';

mongoose.connect(CONFIG.MONGODB_URL);

mongoose.connection.on(
  'error',
  console.error.bind(console, 'connection error:')
);
mongoose.connection.once('open', callback => {
  console.log('Successfully connected to database.');
});

export default mongoose.connection;
