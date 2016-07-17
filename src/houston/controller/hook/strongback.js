/**
 * houston/controller/hook/strongback.js
 * Handles all communcation from atc strongback connections
 */

import _ from 'lodash'
import Promise from 'bluebird'

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

  return build.setStatus('BUILD')
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
  return new Promise((resolve, reject) => {
    const cycle = await Cycle.findOne({
      'builds._id': id
    })
    const build = cycle.builds.id(id)

    const project = await Project.findOne(cycle.project)
    const release = project.releases.find((x) => x.version === cycle.version)

    const status = await build.getStatus()

    if (status !== 'BUILD') {
      log.debug('Received strongback finish data for a build already built')

      return resolve()
    } else {
      log.verbose('Received strongback data for finished build')
    }

    if (!data.success) {
      log.debug(`Building ${project.name} failed`)
      const issue = render('houston/views/issue/build.md', { dist: build.dist, arch: build.arch, log: data.files.log })

      if (data.files != null && data.files.log != null) {
        log.debug('Saving log file')
        await build.setFile('log', data.files.log)
      }

      await build.setStatus('FAIL')
      return project.postIssue(issue)
    }

    await build.setStatus('FINISH')

    if (data.files != null || data.files.deb != null) {
      await github.sendFile(project.github.owner, project.github.name, release.github.id, project.github.token, data.files.deb, {
        content: 'application/vnd.debian.binary-package',
        name: `${project.name}_${cycle.tag}_${build.arch}.deb`,
        label: `apphub ${build.arch} (deb)`
      })
      .catch((error) => {
        log.error('Unable to post debian package to GitHub', error)
      })

      await aptly.upload(project.name, build.arch, cycle.version, data.files.deb)
    }

    // All builds have completed so we set the cycle to review
    if (cycle._status !== 'DEFER' || status !== 'FINISH') return resolve()

    await cycle.setStatus('REVIEW')

    const archs = _.uniq(cycle.builds.map((build) => build.arch))
    const dists = _.uniq(cycle.builds.map((build) => build.dist))

    const packages = await aptly.review(project.name, cycle.version, archs, dists)
    return cycle.update({ packages })
  })
  .catch(async (error) => {
    log.error('Error while trying to process strongback finish', error)

    await cycle.setStatus('ERROR')
    return cycle.update({ mistake: error })
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

  await build.setStatus('ERROR')
  return build.update({ mistake: error })
})
