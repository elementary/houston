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

// Start a new atc connection
const connection = new Atc('strongback')
connection.connect(config.server.url)

log.info('Strongback running')

/*
const data = {
  arch: 'amd64',
  changelog: 'vocal (1.1.1) xenial; urgency=low\n\n    * Changed some things\n\n -- Blake <blake@houston.elementary.io>  Sat, 23 Apr 2016 18:55:21 +0000',
  dist: 'xenial',
  owner: 'vocalapp',
  repo: 'vocal',
  tag: 'master',
  token: 'secretsecret'
}
*/

// TODO: We need to inspect EVERYTHING for shell manipulation data
connection.on('build:start', (data) => {
  log.info(`Starting build for ${data.owner}/${data.repo}#${data.tag}`)

  const projectFolder = path.resolve(projectsFolder, `${data.owner}-${data.repo}-${data.tag}`)
  const repoFolder = path.resolve(projectFolder, 'code')

  cmd(`mkdir -p ${cacheFolder}`)
  .then(() => cmd(`rm -rf ${projectFolder}`))
  .then(() => cmd(`mkdir -p ${repoFolder}`))
  .then(() => cmd(`git clone https://${data.token}@github.com/${data.owner}/${data.repo} ${repoFolder}`))
  .then(() => cmd(`git --git-dir=${repoFolder}/.git --work-tree=${repoFolder} checkout ${data.tag}`))
  .then(() => cmd(`rm -rf ${repoFolder}/.git`))
  .then(() => toFile(data.changelog, `${repoFolder}/debian/changelog`))
  .catch((error) => {
    throw new Mistake(500, 'Unable to setup workspace', error)
  })
  .then(() => {
    log.debug(`Building container for ${data.owner}/${data.repo}#${data.tag}`)

    return new Promise((resolve, reject) => {
      docker.run('houston', [
        '-a', data.arch, '-d', data.dist, '-o', '/houston'
      ], null, {
        Binds: [`${projectFolder}:/houston:rw`, `${cacheFolder}:/var/cache/liftoff:rw`],
        Privileged: true // yes, this is needed for sudo commands
      }, (err, data, container) => {
        if (err) reject(new Mistake(500, 'Unable to create container for build', err))

        container.remove({
          force: true
        }, (err) => {
          if (err) reject(new Mistake(500, 'Unable to cleanup container after build', err))

          resolve(data.StatusCode)
        })
      })
    })
  })
  .then((exitCode) => {
    if (exitCode !== 0) {
      log.info(`Build for ${data.owner}/${data.repo}#${data.tag} failed`)
    } else {
      log.info(`Build for ${data.owner}/${data.repo}#${data.tag} finished`)
    }

    return
  })
  .catch((err) => {
    log.error(`Technical failure building ${data.owner}/${data.repo}#${data.tag}`, err)
  })
  .finally(() => {
    log.debug(`Cleaning up for ${data.owner}/${data.repo}#${data.tag}`)

    if (config.env === 'development') {
      return cmd(`rm -rf ${repoFolder}`)
    } else {
      return cmd(`rm -rf ${projectFolder}`)
    }
  })
})
