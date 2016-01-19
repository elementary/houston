import mongoose from 'mongoose'

const BuildSchema = mongoose.Schema({
  arch: String,
  target: String,
  version: String,
  started: Date,
  finished: Date,
  status: String,
  log: String
})

export { BuildSchema }
