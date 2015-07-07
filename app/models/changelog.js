import mongoose from 'mongoose';

const ChangeLogSchema = mongoose.Schema({
  version:    String,
  author:     String,
  date:       Date,
  items:      [String],
});


export { ChangeLogSchema };
