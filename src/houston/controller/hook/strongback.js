/**
 * houston/controller/hook/strongback.js
 * Handles all communcation from atc strongback connections
 */

import _ from 'lodash'

import * as aptly from '~/houston/service/aptly'
import * as github from '~/houston/service/github'
import atc from '~/houston/service/atc'
import Cycle from '~/houston/model/cycle'
import log from '~/lib/log'
import Mistake from '~/lib/mistake'
import Project from '~/houston/model/project'
import render from '~/lib/render'

/**
 * Updates build when it starts to be built
 *
 * @param {ObjectId} id - build database id
 * @param {Boolean} data - true if test starts
 */
atc.on('build:start', async (id, data) => {
  const cycle = await Cycle.findOne({
    'builds._id': id
  })
  const build = cycle.builds.id(id)
  const status = await build.getStatus()

  if (status !== 'QUEUE') {
    log.debug('Received strongback start data for a build already started')
    return
  } else {
    log.verbose('Received strongback data for start build')
  }

  build.setStatus('BUILD')
})

/**
 * Updates a completed build database information
 *
 * @param {ObjectId} id - build database id
 * @param {Object} data - {
 *   {Boolean} success - true if we ended with a successful build
 *   {Object} files - build log and deb package of finished build
 * }
 */
atc.on('build:finish', async (id, data) => {
  const cycle = await Cycle.findOne({
    'builds._id': id
  })
  const build = cycle.builds.id(id)
  const status = await build.getStatus()
  const project = await Project.findOne(cycle.project)

  if (status !== 'BUILD') {
    log.debug('Received strongback finish data for a build already built')
    return
  } else {
    log.verbose('Received strongback data for finished build')
  }

  if (!data.success) {
    log.debug(`Building ${project.name} failed`)
    const issue = render('houston/issue/build.md', { dist: build.dist, arch: build.arch, log: data.files.log })

    if (data.files != null && data.files.log != null) {
      log.debug('Saving log file')
      build.setFile('deb', data.files.log)
    }

    build.setStatus('FAIL')
    .then(() => project.postIssue(issue))
    return
  }

  build.setStatus('FINISH')
  .then(async () => {
    if (data.files == null || data.files.deb == null) return

    const cycle = await Cycle.findOne({
      'builds._id': id
    })
    const build = cycle.builds.id(id)

    const release = project.releases.find((x) => x.version === cycle.version)

    return github.sendFile(project.github.owner, project.github.name, release.github.id, project.github.token, data.files.deb, {
      content: 'application/vnd.debian.binary-package',
      name: `${project.name}_${cycle.tag}_${build.arch}.deb`,
      label: `apphub ${build.arch} (deb)`
    })
    .catch((error) => {
      log.error('Unable to post debian package to GitHub', error)
    })
    .then(() => aptly.upload(project.package.name, build._id, data.files.deb))
  })
  .then(async () => {
    const cycle = await Cycle.findOne({
      'builds._id': id
    })
    const status = await cycle.getStatus()

    if (cycle._status !== 'DEFER' || status !== 'FINISH') return Promise.resolve()

    // All builds have completed but we have yet to set the next cycle status
    return cycle.setStatus('REVIEW')
    .then(() => {
      const buildIds = cycle.builds.map((build) => build.id)
      const dists = _.uniq(cycle.builds.map((build) => build.dist))

      return aptly.review(project.package.name, cycle.version, buildIds, dists)
      .then((packages) => cycle.update({ packages }))
      .catch((error) => {
        throw new Mistake(500, 'Unable to run aptly review process', error)
      })
    })
  })
  .catch((error) => {
    log.error('Error while trying to process strongback finish', error)

    if (data.files != null && data.files.deb != null) {
      log.debug('Saving deb package')
      build.setFile('deb', data.files.deb)
    }

    return cycle.setStatus('ERROR')
    .then(() => cycle.update({ mistake: error }))
  })
})

/**
* Updates a completed build database information
*
* @param {ObjectId} id - build database id
* @param {Error} error - error that occured during build process
 */
atc.on('build:error', async (id, error) => {
  const cycle = await Cycle.findOne({
    'builds._id': id
  })
  const build = cycle.builds.id(id)
  const status = await build.getStatus()

  if (status !== 'BUILD') {
    log.debug('Received strongback error data for a build already built')
    return
  } else {
    log.verbose('Received strongback data for build error')
  }

  build.setStatus('ERROR')
  .then(() => build.update({ mistake: error }))
})
