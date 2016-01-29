import mongoose from 'mongoose';
import Promise from 'bluebird';
import Hubkit from 'hubkit';

import app from '~/';

let gh = new Hubkit();

const IssueSchema = new mongoose.Schema({
  githubNumber: Number, // Github issue number
  title:        String, // Title of the issue, e.g. "Missing .desktop file"
  body:         String, // Body/content of the issue, e.g. a build log
  created: {            // When this issue was created
    type:       Date,
    default:    Date.now,
  },
  isOpen: {
    type:       Boolean,
    default:    true,
  },
  problems: {
    error:     [String],
    warning:   [String],
  },
});

export default IssueSchema;
