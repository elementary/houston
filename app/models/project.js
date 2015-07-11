import mongoose from 'mongoose';
import Hubkit from 'hubkit';
import Jenkins from 'houston/app/models/jenkins';

import app from 'houston/app';
import { IterationsSchema } from 'houston/app/models/iterations.js';

// Create an instance of Hubkit
var gh = new Hubkit({});

var ApplicationSchema = mongoose.Schema({
  github: {
    owner:    String,   // Owner of the GitHub repository
    name:     String,   // Github Repository name
    repoUrl:  String,   // GitHub Git Repository url
  },
  icon: {
    name:     String,   // 'wingpanel'
    data:     String,   // <base64-encoded image>
  },
  priceUSD:   Number,   // An integer, from appHubFileResult
  name:       String,   // Applications actual name
  package:    String,   // Debian Package Name
  status:     { type: String, default: '' },   // Status of the latest built
  version:    String,                          // Currently published & reviewed version
  iterations: [IterationsSchema],              // Changelog of all published versions with builds
});

/* Make sure all virtual Properties show up in JSON */
ApplicationSchema.set('toJSON', { virtuals: true });

/* Create the Project if it does not exist,
 * needs user data for private GH repos */
ApplicationSchema.statics.findOrCreateGitHubData = function(repoData) {
  return this.findOne({'github.fullName': repoData.full_name}).exec()
    .then(repo => {
      if (repo) {
        return repo;
      } else {
        return this.create({
          github: {
            owner: repoData.owner.login,
            name: repoData.name,
            fullName: repoData.full_name,
          },
          icon: {
            name: null,
            data: null,
          },
          priceUSD: null,
        })
      }
    });
}

ApplicationSchema.statics.updateBuild = function(data) {
  return this.findOne({ 'github.repoUrl': data.parameters.REPO }).exec()
    .then(project => {
      for (var iter in project.iterations) {
        if (project.iterations[iter].version === data.parameters.VERSION) {
          for (var build in project.iterations[iter].builds) {
            if (project.iterations[iter].builds[build].arch   === data.parameters.ARCH &&
                project.iterations[iter].builds[build].target === data.parameters.DIST) {
              switch (data.phase) {
                case 'FINALIZED': {
                  // TODO: Implement notifications for builds
                  return Jenkins.getLogs(data.number)
                    .then(function(log) {
                      project.iterations[iter].builds[build].status = data.status;
                      // TODO: Only save failed builds
                      roject.iterations[iter].builds[build].log = log;
                      return project.save();
                    });
                  break;
                }
                case 'STARTED': {
                  roject.iterations[iter].builds[build].status = 'BUILDING';
                  return project.save();
                  break;
                }
              }
            }
          }
        }
      }
    });
};

ApplicationSchema.methods.doBuild = function(params) {
  if (!params) {
    params = {
      PACKAGE:   this.package,
      REPO:      this.github.repoUrl,
      ARCH:      'amd64',  // TODO: iterate over enabled archs
      DIST:      'trusty', // TODO: iterate over enabled dists
      REFERENCE: 'master', // TODO: use reference from github hooks
      unstable:  true,     // TODO: seprate out stable & unstable builds
    }
  }
  return this.debianVersion(params)
    .then(this.debianChangelog.bind(this))
    .then(Jenkins.doBuild)
    .then(buildId => {
      // Insert a new Build into the Project DB
      this.builds.push({
        arch:       params.ARCH,
        target:     params.DIST,
        version:    params.VERSION,
        status:     'QUEUED',
      });
      return this.save();
    });
}

ApplicationSchema.methods.generateGitHubChangelog = function() {
  // TODO: Add Access Token for private repos
  return gh.request('GET /repos/:owner/:repo/releases', {
      owner: this.github.owner,
      repo: this.github.repo,
      // TODO: Add Token to this request  // token: ,
    }).then(releases => {
      for (var i in releases) {
        // Only count them if they use proper (GitHub suggested) versioning
        if (releases[i].tag_name.substring(0, 1) === 'v') {
          this.changelog.push({
            version: releases[i].tag_name.substring(1),
            author:  releases[i].author.login,
            date:    releases[i].published_at,
            items:   releases[i].body.split('\r\n'),
          });
        }
      }
      return this.save();
    });
};

ApplicationSchema.methods.debianChangelog = function(params) {
  return new Promise((resolve, reject) => {
    app.render('debian-chlg', {
      layout:       false,
      dist:         params.DIST,
      package:      this.package,
      changelog:    this.changelog,
      version:      params.VERSION,
      unstable:     params.unstable,
    }, (err, changelog) => {
      if (err) {
        reject(err);
      } else {
        params.CHANGELOG = changelog;
        resolve(params);
      }
    })
  });
};

ApplicationSchema.methods.debianVersion = function(params) {
  if (!params.unstable) {
    // Use latest Release on GitHub for Versioning
    params.VERSION = this.changelog[0].version;
    // Reset build counter
    this.update({buildId: 0});
    return params;
  } else {
    // Use unstable versioning, basing off of latest Release
    return this.update({ $inc: { buildId: 1 }})
      .then(result => {
        if (result.ok) {
          // Add more meta information for non stable Builds
          params.VERSION = this.changelog[0].version + '+build'
            + this.buildId + '~git.' + params.REFERENCE;
          return params;
        } else {
          throw new Error('Failed to Update BuildId');
        }
      });
  }
}

ApplicationSchema.virtual('github.fullName').get(function() {
  return this.github.owner + '/' + this.github.name;
});
ApplicationSchema.virtual('state.standby').get(function() {
  return (this.status === '' || this.status === null);
});
ApplicationSchema.virtual('state.new-release').get(function() {
  return this.status === 'NEW RELEASE';
});
ApplicationSchema.virtual('state.building').get(function() {
  return this.status === 'BUILDING';
});
ApplicationSchema.virtual('state.failed').get(function() {
  return this.status === 'FAILED';
});
ApplicationSchema.virtual('state.reviewing').get(function() {
  return this.status === 'REVIEWING';
});

var Application = mongoose.model('application', ApplicationSchema);

export { ApplicationSchema, Application };
