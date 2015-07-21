import mongoose from 'mongoose';
import Hubkit from 'hubkit';
import Promise from 'bluebird';
import ini from 'ini';
import semver from 'semver';

import app from 'houston/app';
import Jenkins from 'houston/app/models/jenkins';
import { IterationsSchema } from 'houston/app/models/iterations.js';

// Create an instance of Hubkit
var gh = new Hubkit();

var ApplicationSchema = mongoose.Schema({
  github: {
    owner:    String,   // Owner of the GitHub repository
    name:     String,   // Github Repository name
    repoUrl:  String,   // GitHub Git Repository url
    APItoken: String,   // GitHub accessToken of the last user to access this app
  },
  icon: {
    name:     String,   // 'wingpanel'
    data:     String,   // <base64-encoded image>
  },
  priceUSD:   Number,   // An integer, from appHubFileResult
  name:       String,   // Applications actual name
  package:    String,   // Debian Package Name
  dists:      [String], // Enabled Dists for builds
  archs:      [String], // Enabled Archs for builds
  status:     { type: String, default: '' },   // Status of the latest built
  version:    String,                          // Currently published & reviewed version
  iterations: [IterationsSchema],              // Changelog of all published versions with builds
});

/* Make sure all virtual Properties show up in JSON */
ApplicationSchema.set('toJSON', { virtuals: true });

ApplicationSchema.statics.fetchReleases = function(application) {
  console.log(application.github.fullName);
  return gh.request('GET /repos/:fullName/releases', {
    fullName: application.github.fullName,
    token: application.github.APItoken,
  }).then(releases => {
    let newReleases = false;
    if (typeof application.iterations === 'undefined') {
      application.iterations = [];
    }
    let newestRelease = application.iterations[application.iterations.length - 1];
    if (!newestRelease) {
      newestRelease = { version: '0.0.0' };
    }
    for (var i = releases.length - 1; i >= 0; i--) {
      if (semver.valid(releases[i].tag_name, true)) {
        // Only count them if they use proper (GitHub suggested) versioning and
        // are newer than the current project version
        if (semver.gt(releases[i].tag_name, newestRelease.version, true)) {
          application.iterations.push({
            version:    semver.clean(releases[i].tag_name, true),
            author:     releases[i].author.login,
            date:       releases[i].published_at,
            items:      releases[i].body.split('\r\n'),
            status:     'NEW',
            tag:        releases[i].tag_name,
            builds:     [],
          });
          newReleases = true;
        }
      }
    }
    if (newReleases && (application.status === '' || application.status === undefined)) {
      application.status = 'NEW RELEASE';
    }
    return application;
  });
}

ApplicationSchema.statics.fetchAppHubFile = function(application) {
  const fullName = application.github.fullName;
  return Promise.resolve(gh.request(`GET /repos/${fullName}/contents/.apphub`, {
    token: application.github.APItoken,
  })).then(appHubFileResult => {
    application.appHubFileResult = appHubFileResult;
    return application;
  });
}


ApplicationSchema.statics.parseAppHubFileIfPossible = function(application) {
  return Promise.try(() => {
    // Parse the .desktop file
    const appHubFileBuf = new Buffer(application.appHubFileResult.content, 'base64');
    const appHubData = JSON.parse(appHubFileBuf.toString());
    application.priceUSD = appHubData.priceUSD;
    delete application.appHubFileResult;
    return application;
  })
  .catch(() => application);
}

ApplicationSchema.statics.fetchDesktopFileIfPossible = function(application) {
  const fullName = application.github.fullName;
  const repoName = application.github.name;
  return gh.request(`GET /repos/${fullName}/contents/data/${repoName}.desktop`, {
    token: application.github.APItoken,
  }).then(desktopFileResult => {
    // Parse the .desktop file
    const desktopFileBuf = new Buffer(desktopFileResult.content, 'base64');
    const desktopData = ini.parse(desktopFileBuf.toString());
    application.name = desktopData['Desktop Entry'].Name;
    application.icon.name = desktopData['Desktop Entry'].Icon;
    return application;
  })
  .catch(() => application);
}

ApplicationSchema.statics.fetchAppIconIfPossible = function(application) {
  const fullName = application.github.fullName;
  const iconName = application.icon.name;
  return gh.request(`GET /repos/${fullName}/contents/icons/64/${iconName}.svg`, {
    token: application.github.APItoken,
  }).then(appIconResult => {
    // `appIconResult.content` is already base64-encoded
    application.icon.data = appIconResult.content;
    return application;
  })
  .catch(() => application);
}

ApplicationSchema.statics.updateBuild = function(data) {
  // TODO: Clean this up, it's crappy code!
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
                      project.iterations[iter].builds[build].log = log;
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
}

ApplicationSchema.statics.doBuild = function(application) {
  const iteration = application.iterations[application.iterations.length - 1];

  const params = {
    PACKAGE:   application.package ? application.package : application.github.name ,
    REPO:      application.github.repoUrl,
    VERSION:   iteration.version,
    ARCH:      'amd64',        // TODO: iterate over enabled archs
    DIST:      'trusty',       // TODO: iterate over enabled dists
    REFERENCE: iteration.tag,
  };
  console.log(params);
  return ApplicationSchema.statics.debianChangelog(application, params)
    .then(Jenkins.doBuild)
    .then(buildId => {
      // Insert a new Build into the Project DB
      iteration.builds.push({
        arch:       params.ARCH,
        target:     params.DIST,
        status:     'QUEUED',
      });
      return application.save();
    });
}

ApplicationSchema.statics.debianChangelog = function(application, params) {
  return new Promise((resolve, reject) => {
    app.render('debian-chlg', {
      layout:       false,
      dist:         params.DIST,
      package:      params.PACKAGE,
      iterations:   application.iterations,
    }, (err, changelog) => {
      if (err) {
        reject(err);
      } else {
        params.CHANGELOG = changelog;
        resolve(params);
      }
    })
  });
}

/* Add some helper properties to make our lives easy */
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
