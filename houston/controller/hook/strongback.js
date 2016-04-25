/**
 * houston/controller/hook/strongback.js
 * Handles all communcation from atc strongback connections
 */

import atc from '~/houston/service/atc'
import Cycle from '~/houston/model/cycle'
import log from '~/lib/log'
import Mistake from '~/lib/mistake'

/**
 * Updates build when we get confirmation of it running
 *
 * @param {Object} build - {
 *   {String} arch
 *   {String} dist
 *   {String} name
 *   {String} version
 * }
 */
atc.on('build:start:received', (build) => {
  Cycle.update({
    name: build.name,
    version: build.version,
    'builds.arch': build.arch,
    'builds.dist': build.dist
  }, {
    'builds.$.status': 'BUILD'
  })
  .exec()
})

/**
 * Receives built data from build
 *
 * @param {Object} - {
 *   {Boolean} success - true if successful build
 *   {Object} files - files to send back to houston
 *   {String} arch - architecture to build (amd64)
 *   {String} dist - distribution to build (xenial)
 *   {String} name - project name (vocal)
 *   {String} version - package version (2.0.0)
 * }
 */
atc.on('build:finish', async (build) => {
  const cycle = await Cycle.update({
    name: build.name,
    version: build.version,
    'builds.arch': build.arch,
    'builds.dist': build.dist
  }, {
    'builds.$.status': (build.success) ? 'FINISH' : 'FAIL'
  }, { new: true })
  .exec()

  const cBuild = cycle.builds.filter((tBuild) => {
    return (tBuild.arch === build.arch && tBuild.dist === build.dist)
  })[0]

  if (cBuild === null) {
    log.error('Trying to update build information for non existent build')
    return
  }

  Promise.all(build.files, (name) => {
    return cBuild.file.set(name, build.files[name])
  })
  .then(() => {
    log.debug(`Updated build information for ${cycle.name} for ${cBuild.arch} on ${cBuild.dist}`)
  })
})

/**
 * Receives error on building
 *
 * @param {Object} - {
 *   {Error} error - building mistake
 *   {String} arch - architecture to build (amd64)
 *   {String} dist - distribution to build (xenial)
 *   {String} name - project name (vocal)
 *   {String} version - package version (2.0.0)
 * }
 */
atc.on('build:error', (build) => {
  if (!build.error.mistake) {
    build.error = new Mistake(500, 'Unable to build', build.error)
  }

  Cycle.update({
    name: build.name,
    version: build.version,
    'builds.arch': build.arch,
    'builds.dist': build.dist
  }, {
    'builds.$.status': 'ERROR',
    'builds.$.mistake': build.error
  })
  .exec()
})
