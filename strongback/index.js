/**
 * strongback/index.js
 * Client for building packages in a docker environment
 */

import _ from 'lodash'
import Docker from 'dockerode'
import fs from 'fs'
import path from 'path'

import Atc from '~/lib/atc'
import config from '~/lib/config'
import log from '~/lib/log'
import Mistake from '~/lib/mistake'

const docker = new Docker({ socketPath: config.strongback.socket })
const spawn = require('child_process').spawn

const cacheFolder = path.resolve(__dirname, 'cache')
const projectsFolder = path.resolve(__dirname, 'projects')

/**
 * cmd
 * Executes a command on server
 *
 * @param {String} command - command to be executed
 * @returns {Promise}
 */
function cmd (command) {
  const arr = command.split(' ')

  return new Promise((resolve, reject) => {
    const child = spawn(arr[0], _.drop(arr))

    child.stdout.on('data', (data) => log.silly('Local =>', data.toString('utf8')))
    child.stderr.on('data', (data) => log.silly('Local =>', data.toString('utf8')))

    child.on('close', (code) => {
      if (code === 0) {
        return resolve()
      } else {
        return reject(code)
      }
    })
  })
}

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

// Check for docker image
// TODO: we need to pack the docker folder in a tar archive and automaticly build the image
docker.listImages((err, images) => {
  if (err) {
    log.error('Failed to grab list of images. Do you have access to docker?')
    log.error(err)
    process.exit(1)
  }

  const houstonImages = images.filter((image) => {
    return (image.RepoTags.indexOf('houston:latest') !== -1)
  })

  if (houstonImages.length > 0) {
    log.info('Found houston image in docker')
  } else {
    log.error('Could not find houston image in docker. Please manually create docker image')
    log.error(`Simply run 'docker build -t houston .' in ${path.resolve(__dirname, 'docker')}`)
    process.exit(1)
  }
})

// Start a new atc connection
const connection = new Atc('strongback')
connection.connect(config.server.url)

log.info('Strongback running')

/**
 * Builds a repository
 *
 * @param {Object} data - {
 *   {String} arch - architecture to build (amd64)
 *   {String} changelog - build changelog
 *   {String} dist - distribution to build (xenial)
 *   {String} name - project name (vocal)
 *   {String} repo - git repository (https://github.com/elementary/vocal)
 *   {String} tag - git tag to checkout (v2.0.0)
 *   {String} version - package version (2.0.0)
 * }
 * @returns {Object} - {
 *   {Boolean} success - true if successful build (only exists on build)
 *   {Error} error - error while trying to build (only exists on failure to run build)
 *   {Object} files - files to send back to houston
 *   {String} arch - architecture to build (amd64)
 *   {String} dist - distribution to build (xenial)
 *   {String} name - project name (vocal)
 *   {String} repo - git repo address (https://github.com/elementary/vocal)
 *   {String} tag - git tag to checkout (v2.0.0)
 *   {String} version - package version (2.0.0)
 * }
 */
connection.on('build:start', (data) => {
  // Added security measure just in case someone tries to slip us something bad
  data.arch = escape(data.arch.replace(/[\/]/gi, ''))
  data.dist = escape(data.dist.replace(/[\/]/gi, ''))
  data.name = escape(data.name.replace(/[\/]/gi, ''))
  data.tag = escape(data.tag.replace(/[\/]/gi, ''))

  log.info(`Starting build for ${data.name}#${data.tag}`)

  const projectFolder = path.resolve(projectsFolder, `${data.name}#${data.tag}`)
  const repoFolder = path.resolve(projectFolder, 'code')

  cmd(`rm -rf ${projectFolder}`) // Clean up any left behind data
  .then(() => Promise.all([ // Create all needed folders if they don't exist
    cmd(`mkdir -p ${cacheFolder}`),
    cmd(`mkdir -p ${repoFolder}`)
  ]))
  .then(() => { // Git repository setup
    return cmd(`git clone ${data.repo} ${repoFolder}`)
    .then(() => cmd(`git --git-dir=${repoFolder}/.git --work-tree=${repoFolder} checkout ${data.tag}`))
    .then(() => cmd(`rm -rf ${repoFolder}/.git`))
  })
  .then(() => { // Changelog creation TODO: move to hook system
    return cmd(`mkdir -p ${repoFolder}/debian`)
    .then(() => cmd(`rm -f ${repoFolder}/debian/changelog`))
    .then(() => toFile(data.changelog, `${repoFolder}/debian/changelog`))
  })
  .catch((error) => {
    throw new Mistake(500, 'Unable to setup workspace', error)
  })
  .then(() => { // Run build container
    log.debug(`Building container for ${data.name}#${data.tag}`)

    return new Promise((resolve, reject) => {
      docker.run('houston', [
        '-a', data.arch, '-d', data.dist, '-o', '/houston'
      ], null, {
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

    // Return blank strings if we can't access the files
    const logFile = await fromFile(`${projectFolder}/${data.name}_${data.version}_${data.arch}.log`)
    .catch((error) => {
      log.error('Failed to grab log file after build', error)
      return ''
    })
    const debFile = await fromFile(`${projectFolder}/${data.name}_${data.version}_${data.arch}.deb`, undefined)
    .catch((error) => {
      log.error('Failed to grab deb file after build', error)
      return ''
    })

    // TODO: wait until all things are sent before removing folders
    return connection.send('houston', 'build:finish', {
      arch: data.arch,
      dist: data.dist,
      name: data.name,
      repo: data.repo,
      success: (exitCode === 0),
      tag: data.tag,
      version: data.version,
      files: {
        log: logFile,
        deb: debFile
      }
    })
  })
  .catch((error) => {
    log.error(`Technical failure building ${data.name}#${data.tag}`, error)

    return connection.send('houston', 'build:error', {
      arch: data.arch,
      dist: data.dist,
      error,
      name: data.name,
      repo: data.repo,
      tag: data.tag,
      version: data.version
    })
  })
  .finally(() => { // Clean up all left over files
    log.debug(`Cleaning up for ${data.name}#${data.tag}`)

    return cmd(`rm -rf ${projectFolder}`)
  })
})
