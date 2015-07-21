import mongoose from 'mongoose';

const IterationsSchema = mongoose.Schema({
  version:    String,
  author:     String,
  date:       Date,
  items:      [String],
  status:     String,
  tag:        String,
  builds:     [ {
    arch:       String,
    target:     String,
    started:    Date,
    finished:   Date,
    status:     String,
    log:        String,
  }, ],
});


export { IterationsSchema };
