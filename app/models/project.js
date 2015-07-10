import mongoose from 'mongoose';
import Hubkit from 'hubkit';
import Jenkins from 'houston/app/models/jenkins';

import app from 'houston/app';
import { BuildSchema } from 'houston/app/models/build.js';
import { ChangeLogSchema } from 'houston/app/models/changelog.js';

// Create an instance of Hubkit
var gh = new Hubkit({});

var ProjectSchema = mongoose.Schema({
  source:     String,
  name:       String,
  package:    String,
  repoUrl:    String,
  version:    String,
  keysSetup:  Boolean,
  hookSetup:  Boolean,
  github:     {owner: String, repo: String, token: String},
  buildId:    {type: Number, default: 0 },
  builds:     [BuildSchema],
  changelog:  [ChangeLogSchema],
});

/* Create the Project if it does not exist,
 * needs user data for private GH repos */
ProjectSchema.statics.findOrCreateGitHub = function(owner, reponame, user) {
  var self = this;
  return self.findOne({'github.owner': owner, 'github.repo': reponame}).exec()
    .then(function(repo) {
      if (repo) {
        return repo;
      } else {
        return gh.request('GET /repos/:owner/:repo', {
            owner: owner,
            repo:  reponame,
            token: user.github.accessToken,
          }).then(function(repoData) {
            return self.create({
              source:     'github',
              name:       owner + '/' + reponame,
              package:    reponame,
              repoUrl:    repoData['git_url'],
              keysSetup:  false,
              hookSetup:  false,
              github: {
                owner:    owner,
                repo:     reponame,
                token:    user.github.accessToken,
              },
            });
          });
      }
    });
};

ProjectSchema.statics.updateBuild = function(data) {
  var self = this;
  return self.findOne({
      builds: {
        $elemMatch: {
          arch:    data.parameters.ARCH,
          target:  data.parameters.DIST,
          version: data.parameters.VERSION,
        },
      },
    }).exec()
    .then(function(project) {
      for (var build in project.builds) {
        if (project.builds[build].arch    === data.parameters.ARCH &&
            project.builds[build].target  === data.parameters.DIST &&
            project.builds[build].version === data.parameters.VERSION) {
          switch (data.phase) {
            case 'FINALIZED': {
              // TODO: Implement notifications for builds
              return Jenkins.getLogs(data.number)
                .then(function(log) {
                  project.builds[build].status = data.status;
                  project.builds[build].log = log;
                  return project.save();
                });
              break;
            }
            case 'STARTED': {
              project.builds[build].status = 'BUILDING';
              return project.save();
              break;
            }
          }
        }

      }
    });
};

ProjectSchema.methods.doBuild = function(params) {
  var self = this;
  if (!params) {
    params = {
      PACKAGE:   self.package,
      REPO:      self.repoUrl,
      ARCH:      'amd64',  // TODO: iterate over enabled archs
      DIST:      'trusty', // TODO: iterate over enabled dists
      REFERENCE: 'master', // TODO: use reference from github hooks
      unstable:  true,     // TODO: seprate out stable & unstable builds
    }
  }
  return self.debianVersion(params)
    .then(self.debianChangelog.bind(self))
    .then(Jenkins.doBuild)
    .then(function(buildId) {
      // Insert a new Build into the Project DB
      self.builds.push({
        arch:       params.ARCH,
        target:     params.DIST,
        version:    params.VERSION,
        status:     'QUEUED',
      });
      return self.save();
    });
}

ProjectSchema.methods.generateGitHubChangelog = function() {
  var self = this;
  // TODO: Add Access Token for private repos
  return gh.request('GET /repos/:owner/:repo/releases', {
      owner: self.github.owner,
      repo: self.github.repo,
      // TODO: Add Token to this request  // token: ,
    }).then(function(releases) {
      for (var i in releases) {
        // Only count them if they use proper (GitHub suggested) versioning
        if (releases[i].tag_name.substring(0, 1) === 'v') {
          self.changelog.push({
            version: releases[i].tag_name.substring(1),
            author:  releases[i].author.login,
            date:    releases[i].published_at,
            items:   releases[i].body.split('\r\n'),
          });
        }
      }
      return self.save();
    });
};

ProjectSchema.methods.debianChangelog = function(params) {
  var self = this;
  return new Promise(function(resolve, reject) {
    app.render('debian-chlg', {
      layout:       false,
      dist:         params.DIST,
      package:      self.package,
      changelog:    self.changelog,
      version:      params.VERSION,
      unstable:     params.unstable,
    }, function(err, changelog) {
      if (err) {
        reject(err);
      } else {
        params.CHANGELOG = changelog;
        resolve(params);
      }
    })
  });
};

ProjectSchema.methods.debianVersion = function(params) {
  var self = this;
  if (!params.unstable) {
    // Use latest Release on GitHub for Versioning
    params.VERSION = self.changelog[0].version;
    // Reset build counter
    self.update({buildId: 0});
    return params;
  } else {
    // Use unstable versioning, basing off of latest Release
    return self.update({ $inc: { buildId: 1 }})
      .then(function(result) {
        if (result.ok) {
          // Add more meta information for non stable Builds
          params.VERSION = self.changelog[0].version + '+build'
            + self.buildId + '~git.' + params.REFERENCE;
          return params;
        } else {
          throw new Error('Failed to Update BuildId');
        }
      });
  }
}

ProjectSchema.pre('save', function(next) {
  // TODO: Limit kept build results to some number set in CONFIG
  next();
});

var Project = mongoose.model('project', ProjectSchema);

export { ProjectSchema, Project };
