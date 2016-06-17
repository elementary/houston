/**
 * strongback/index.js
 * Client for building packages in a docker environment
 */

import Docker from 'dockerode'
import fs from 'fs'
import path from 'path'

import * as local from '~/lib/local'
import Atc from '~/lib/atc'
import config from '~/lib/config'
import log from '~/lib/log'
import Mistake from '~/lib/mistake'
import render from '~/lib/render'

const docker = new Docker({ socketPath: config.strongback.socket })

const cacheFolder = path.resolve(__dirname, 'cache')
const projectsFolder = path.resolve(__dirname, 'projects')

/**
 * toFile
 * Writes string to file
 *
 * @param {String} data - what to write to file
 * @param {String} file - file to write to
 * @returns {Promise}
 */
function toFile (data, file) {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, (err) => {
      if (err) return reject(err)

      return resolve()
    })
  })
}

/**
 * fromFile
 * Returns data from file
 *
 * @param {String} file - file to read
 * @param {String} encoding - encoding to use when reading file
 * @returns {Promise} - file data
 */
function fromFile (file, encoding = 'utf8') {
  return new Promise((resolve, reject) => {
    fs.readFile(file, { encoding }, (err, data) => {
      if (err) return reject(err)

      return resolve(data)
    })
  })
}

/**
 * createChangelog
 * Returns debian changelog
 *
 * @param {String} name - project name
 * @param {String} dist - distribution to put in changelog
 * @param {Array} changelogs - houston changelog array
 * @returns {String} - rendered debian changelog
 */
function createChangelog (name, dist, changelogs) {
  return new Promise((resolve, reject) => {
    const changelog = []
    changelogs.forEach((change) => {
      const rendered = render('strongback/changelog.nun', Object.assign({ name, dist }, change), false)
      changelog.push(rendered.body)
    })

    return resolve(changelog.join('\n\n'))
  })
}

/**
 * ensureImage
 * Check for docker houston image
 *
 * @returns {Boolean} - true if image exists, else catch
 */
function ensureImage () {
  return new Promise((resolve, reject) => {
    docker.listImages((err, images) => {
      if (err) return reject(err)

      const houstonImages = images.filter((image) => {
        return (image.RepoTags.indexOf('houston:latest') !== -1)
      })

      if (houstonImages.length > 0) {
        return resolve(true)
      } else {
        return reject(new Mistake(500, 'Houston image does not exist'))
      }
    })
  })
}

/**
 * runBuild
 * Starts a build from information and returns built information
 *
 * @param {Object} data - {
 *   {String} arch - architecture to build (amd64)
 *   {String} changelog - build changelog
 *   {String} dist - distribution to build (xenial)
 *   {String} name - package name (vocal)
 *   {String} repo - git repository (https://github.com/elementary/vocal)
 *   {String} tag - git tag to checkout (v2.0.0)
 *   {String} version - package version (2.0.0)
 * }
 * @returns {Object} - {
 *   {Boolean} success - true if successful build (only exists on build)
 *   {Error} error - error while trying to build (only exists on failure to run build)
 *   {Object} files - files to send back to houston
 * }
 */
function runBuild (data) {
  // Added security measure just in case someone tries to slip us something bad
  data.arch = escape(data.arch.replace(/[\/]/gi, ''))
  data.dist = escape(data.dist.replace(/[\/]/gi, ''))
  data.name = escape(data.name.replace(/[\/]/gi, ''))
  data.tag = escape(data.tag.replace(/[\/]/gi, ''))

  log.info(`Starting build for ${data.name}#${data.tag}`)

  const projectFolder = path.resolve(projectsFolder, `${data.name}#${data.tag}`)
  const repoFolder = path.resolve(projectFolder, 'code')

  return local.cmd(`rm -rf ${projectFolder}`) // Clean up any left behind data
  .then(() => Promise.all([ // Create all needed folders if they don't exist
    local.cmd(`mkdir -p ${cacheFolder}`),
    local.cmd(`mkdir -p ${repoFolder}`)
  ]))
  .then(() => { // Git repository setup
    return local.cmd(`git clone --depth 1 ${data.repo} ${repoFolder}`)
    .then(() => local.cmd(`git --git-dir=${repoFolder}/.git --work-tree=${repoFolder} checkout ${data.tag}`))
    .then(() => local.cmd(`rm -rf ${repoFolder}/.git`))
  })
  .then(() => { // Changelog creation TODO: move to hook system
    return local.cmd(`mkdir -p ${repoFolder}/debian`)
    .then(() => local.cmd(`rm -f ${repoFolder}/debian/changelog`))
    .then(() => createChangelog(data.name, data.dist, data.changelog))
    .then((changelog) => toFile(changelog, `${repoFolder}/debian/changelog`))
  })
  .catch((error) => {
    throw new Mistake(500, 'Unable to setup workspace', error)
  })
  .then(() => { // Run build container
    log.debug(`Building container for ${data.name}#${data.tag}`)
    const outlog = (config.env === 'development') ? process.stdout : null

    return new Promise((resolve, reject) => {
      docker.run('houston', [
        '-a', data.arch, '-d', data.dist, '-o', '/houston'
      ], outlog, {
        Binds: [`${projectFolder}:/houston:rw`, `${cacheFolder}:/var/cache/liftoff:rw`],
        Privileged: true // yes, this is needed for sudo commands
      }, (err, data, container) => {
        if (err) reject(new Mistake(500, `Unable to create container for ${data.name}#${data.tag}`, err))

        container.remove({
          force: true
        }, (err) => {
          if (err) reject(new Mistake(500, `Unable to cleanup ${data.name}#${data.tag} after build`, err))

          resolve(data.StatusCode)
        })
      })
    })
  })
  .then(async (exitCode) => { // Container is stopped and removed
    if (exitCode !== 0) {
      log.info(`Build for ${data.name}#${data.tag} failed`)
    } else {
      log.info(`Build for ${data.name}#${data.tag} finished`)
    }

    // TODO: search for file names because the might not be consistant with data.name
    const logFile = await fromFile(`${projectFolder}/${data.name}_${data.version}_${data.arch}.log`)
    .catch((error) => {
      log.warn('Failed to grab log file after build', error)
    })

    const debFile = await fromFile(`${projectFolder}/${data.name}_${data.version}_${data.arch}.deb`, null)
    .catch((error) => {
      log.warn('Failed to grab deb file after build', error)
    })

    return {
      success: (exitCode === 0),
      files: {
        log: logFile,
        deb: debFile
      }
    }
  })
  .finally((...stuff) => { // Clean up all left over files
    log.debug(`Cleaning up for ${data.name}#${data.tag}`)

    if (config.env !== 'development') {
      return local.cmd(`rm -rf ${projectFolder}`)
    }

    return stuff
  })
}

/**
 * Starts a build from information and returns built information
 *
 * @param {Object} data - {
 *   {ObjectId} id - build database id
 *   {String} arch - architecture to build package on (amd64)
 *   {String} dist - distribution to build package on (xenial)
 *   {String} name - package name
 *   {String} repo - git repo 'git@github.com:elementary/houston.git'
 *   {String} tag - git tag for given repo 'master'
 *   {String} version - project version we are testing
 *   {Array} changelog - changelog object for current release testing
 * }
 * @returns {ObjectId} - build database id
 * @returns {Object} - {
 *   {Boolean} success - true if we ended with a successful build
 *   {Object} files - build log and deb package of finished build
 * }
 */
ensureImage()
.catch((err) => {
  log.error('Unable to ensure Houston docker image exists')
  log.error(err)
  process.exit(1)
})
.then(() => {
  const connection = new Atc('strongback')
  connection.connect(config.server.url)

  log.info('Strongback running')

  connection.on('build:queue', (data) => {
    log.debug(`Starting build on ${data.name} for ${data.dist} on ${data.arch}`)
    connection.send('houston', 'build:start', data.id, true)

    runBuild(data)
    .then((pkg) => {
      log.debug(`Build finished for ${data.name}`)
      connection.send('houston', 'build:finish', data.id, pkg)
    })
    .catch((error) => {
      log.warn(`Error building ${data.name}`, error)
      connection.send('houston', 'build:error', data.id, error)
    })
  })
})
