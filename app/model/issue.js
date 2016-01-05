import app from '~/'

import mongoose from 'mongoose';
import Promise from 'bluebird';
import Hubkit from 'hubkit';

let gh = new Hubkit();

const IssueSchema = mongoose.Schema({
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
});

IssueSchema.methods.syncToGitHub = function() {
  // Issue already created on GitHub
  const application = this.ownerDocument();
  const fullName = application.github.fullName;
  if (this.githubNumber) {
    app.log.silly('github number true');
    return gh.request(`GET /repos/${fullName}/issues/${this.githubNumber}`, {
      token: application.github.APItoken,
    })
    .then(issue => {
      this.isOpen = issue.state === 'open';
      return this.save();
    });
  } else {
    return gh.request(`POST /repos/${fullName}/issues`, {
      token: application.github.APItoken,
      body: {
        title: this.title,
        body: this.body,
        labels: [application.label],
      },
    }).then(issue => {
      this.githubNumber = issue.number;
      return this.save();
    });
  }
}

export default IssueSchema;
