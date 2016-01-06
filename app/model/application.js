import mongoose from 'mongoose'
import Hubkit from 'hubkit'
import Promise from 'bluebird'
import ini from 'ini'
import semver from 'semver'

import app from '~/'
import ReleasesSchema from './releases'
import IssueSchema from './issue'

// Create an instance of Hubkit
var gh = new Hubkit()

var ApplicationSchema = mongoose.Schema({
  github: {
    owner: String,            // Owner of the GitHub repository
    name: String,             // Github Repository name
    repoUrl: String,          // GitHub Git Repository url
    APItoken: String          // GitHub accessToken of the last user to access this app
  },
  icon: {
    name: String,             // 'wingpanel'
    data: String              // <base64-encoded image>
  },
  priceUSD: Number,           // An integer, from appHubFileResult
  name: String,               // Applications actual name
  package: String,            // Debian Package Name
  dists: {                    // Enabled Dists-Arch for builds eg. trusty-amd64, trusty-i386
    type: [String],
    default: ['trusty-amd64', 'trusty-i386']
  },
  status: {                   // Status of the latest built
    type: String,
    default: 'STANDBY',
    enum: ['REVIEWING', 'FAILED', 'BUILDING', 'NEW RELEASE', 'STANDBY']
  },
  version: String,            // Currently published & reviewed version
  releases: [ReleasesSchema], // Changelog of all published versions with builds
  issues: [IssueSchema],
  label: {                    // Github issue label
    type: String,
    default: 'AppHub'
  }
})

// Make sure all virtual Properties show up in JSON
ApplicationSchema.set('toJSON', { virtuals: true })

ApplicationSchema.statics.fetchReleases = function (application) {
  const fullName = application.github.fullName
  app.log.silly(`Application.fetchReleases called on ${fullName}`)

  return Promise.resolve(gh.request(`GET /repos/${fullName}/releases`, {
    token: application.github.APItoken
  })).then(releases => {
    let newReleases = false
    if (typeof application.releases === 'undefined') {
      application.releases = []
    }
    let newestRelease = application.releases[application.releases.length - 1]
    if (!newestRelease) {
      newestRelease = { version: '0.0.0' }
    }

    for (let i = releases.length - 1; i >= 0; i--) {
      if (semver.valid(releases[i].tag_name, true)) {
        // Only count them if they use proper (GitHub suggested) versioning and
        // are newer than the current project version
        if (semver.gt(releases[i].tag_name, newestRelease.version, true)) {
          application.releases.push({
            version: semver.clean(releases[i].tag_name, true),
            author: releases[i].author.login,
            date: releases[i].published_at,
            items: releases[i].body.split('\r\n'),
            status: 'NEW RELEASE',
            tag: releases[i].tag_name,
            builds: []
          })
          newReleases = true
        }
      }
    }

    if (newReleases && application.state.standby) {
      application.status = 'NEW RELEASE'
    }
    return application
  })
}

ApplicationSchema.statics.parseAppHubFile = function (application) {
  const fullName = application.github.fullName

  return gh.request(`GET /repos/${fullName}/contents/.apphub`, {
    token: application.github.APItoken
  })
  .then(appHubFile => {
    // Parse the .apphub file
    const desktopFileBuf = new Buffer(appHubFile.content, 'base64')
    const appHubFileJSON = JSON.parse(desktopFileBuf.toString())
    application.priceUSD = appHubFileJSON.priceUSD
    application.label = appHubFileJSON.issueLabel
    return application
  })
}

ApplicationSchema.statics.fetchDesktopFileIfPossible = function (application) {
  const fullName = application.github.fullName
  const repoName = application.github.name

  return gh.request(`GET /repos/${fullName}/contents/data/${repoName}.desktop`, {
    token: application.github.APItoken
  }).then(desktopFileResult => {
    // Parse the .desktop file
    const desktopFileBuf = new Buffer(desktopFileResult.content, 'base64')
    const desktopData = ini.parse(desktopFileBuf.toString())
    application.name = desktopData['Desktop Entry'].Name
    application.icon.name = desktopData['Desktop Entry'].Icon
    return application
  })
  .catch(() => application)
}

ApplicationSchema.statics.fetchAppIconIfPossible = function (application) {
  const fullName = application.github.fullName
  const iconName = application.icon.name

  return gh.request(`GET /repos/${fullName}/contents/icons/64/${iconName}.svg`, {
    token: application.github.APItoken
  }).then(appIconResult => {
    // `appIconResult.content` is already base64-encoded
    application.icon.data = appIconResult.content
    return application
  })
  .catch(() => application)
}

// Updates Information on Builds based on Jenkins hooks (build started, build finished ...)
ApplicationSchema.statics.updateBuild = function (data) {
  const objectIDs = data.parameters.IDENTIFIER.split('#')

  return this.findOne({_id: objectIDs[0]}).exec()
    .then(application => {
      let iteration = application.releases.id(objectIDs[1])
      // Update that Build with Jenkins Data
      return iteration.updateBuild(objectIDs[2], data)
        .then(iteration => {
          let buildsFinished = true
          let buildsFailed = false
          iteration = application.releases.id(objectIDs[1])

          for (let i = 0; i < iteration.builds.length; i++) {
            switch (iteration.builds[i].status) {
              case 'FAILED': {
                buildsFailed = true
                break
              }
              case 'QUEUED':
              case 'STARTED': {
                buildsFinished = false
                break
              }
            }
          }

          if (buildsFinished) {
            if (buildsFailed) {
              // TODO: Builds Failed, File issues on GitHub
              iteration.status = 'FAILED'
            } else {
              iteration.status = 'SUCESS'
            }
          }

          application.save()
        })
    })
}

ApplicationSchema.statics.debianChangelog = function (application, params) {
  const promises = []

  for (let i in params) {
    promises.push(new Promise((resolve, reject) => {
      app.render('debian-chlg', {
        layout: false,
        dist: params[i].DIST,
        package: params[i].PACKAGE,
        releases: application.releases
      }, (err, changelog) => {
        if (err) {
          reject(err)
        } else {
          params[i].CHANGELOG = changelog
          resolve(params[i])
        }
      })
    }))
  }

  return promises
}

ApplicationSchema.statics.syncIssuesToGitHub = function (application) {
  return Promise
    .all(application.issues.map(issue => issue.syncToGitHub()))
    .then(() => application)
}

ApplicationSchema.statics.createLabelIfNeeded = function (application) {
  const fullName = application.github.fullName
  const label = application.label

  return gh.request(`GET /repos/${fullName}/labels/${label}`, {
    token: application.github.APItoken
  })
  .catch(err => {
    if (err.status === 404) {
      gh.request(`POST /repos/${fullName}/labels`, {
        token: application.github.APItoken,
        body: {
          name: application.label,
          color: '3A416F'
        }
      })
    }
  })
  .then(() => application)
}

// Add some helper properties to make our lives easy
ApplicationSchema.virtual('github.fullName').get(function () {
  return `${this.github.owner}/${this.github.name}`
})
ApplicationSchema.virtual('state.standby').get(function () {
  return this.status === 'STANDBY'
})
ApplicationSchema.virtual('state.new-release').get(function () {
  return this.status === 'NEW RELEASE'
})
ApplicationSchema.virtual('state.building').get(function () {
  return this.status === 'BUILDING'
})
ApplicationSchema.virtual('state.failed').get(function () {
  return this.status === 'FAILED'
})
ApplicationSchema.virtual('state.reviewing').get(function () {
  return this.status === 'REVIEWING'
})

var Application = mongoose.model('application', ApplicationSchema)

export { ApplicationSchema, Application }
