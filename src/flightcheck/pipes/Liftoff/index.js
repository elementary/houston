/**
 * flightcheck/pipes/Liftoff/index.js
 * Runs Liftoff in a docker container to build cmake projects
 *
 * @exports {Class} - Builds projects with liftoff
 */

import path from 'path'
import Promise from 'bluebird'

import * as fsHelper from 'lib/helpers/fs'
import config from 'lib/config'
import File from 'flightcheck/file'
import Log from 'lib/log'
import Pipe from 'flightcheck/pipes/pipe'

const fs = Promise.promisifyAll(require('fs'))

const log = new Log('flightcheck:Liftoff')

/**
 * Liftoff
 * Builds projects with liftoff
 */
export default class Liftoff extends Pipe {
  /**
   * Creates a new Pipe
   *
   * @param {Object} pipeline - Current running Pipeline
   */
  constructor (pipeline) {
    super(pipeline)

    // these are file paths relative to the build directory
    this.data = {
      file: null,
      log: null
    }
  }

  /**
   * code
   * Builds projects with liftoff
   *
   * @param {String} p - folder holding cmake file
   * @param {String} a - architecture to build
   * @param {String} d - distribution to build
   * @returns {Void}
   */
  async code (p = 'repository', a = 'amd64', d = 'xenial') {
    await this.require('Debian', p, d)

    log.debug('Running liftoff')

    const buildPath = path.join(this.pipeline.build.dir, p)
    const cacheDir = path.join(config.flightcheck.directory, 'liftoff', 'cache')
    await fsHelper.mkdirp(cacheDir)

    log.debug(`Using cache directory: ${cacheDir}`)

    const returned = await this.docker('liftoff', ['-a', a, '-d', d, '-o', '/tmp/flightcheck'], buildPath, {
      Binds: [`${cacheDir}:/var/cache/liftoff:rw`],
      Privileged: true // required because of chroot in liftoff
    })

    this.data.log = returned.log

    if (returned.exit !== 0) {
      log.debug(`Flightcheck returned ${returned.exit} exit code`)

      try {
        const file = new File(path.resolve(this.pipeline.build.dir, returned.log))
        const log = await file.read()
        return this.log('error', 'Liftoff/failure.md', log)
      } catch (e) {
        log.debug('Unable to fetch log of failed Liftoff build')
        log.debug(e)
        return this.log('error', 'Liftoff/failure.md')
      }
    }

    const debs = await fs.readdirAsync(buildPath)
      .filter(async (p) => {
        const stat = await fs.statAsync(path.join(buildPath, p))

        if (!stat.isFile()) return false
        return (path.extname(p) === '.deb')
      })

    log.debug(`Found ${debs.length} deb files in folder`)

    const deb = debs.find((deb) => {
      if (deb.indexOf(this.pipeline.build.name) === -1) return false
      if (deb.indexOf(a) === -1) return false
      if (deb.indexOf(this.pipeline.build.version) === -1) return false
      return true
    })

    if (deb != null) {
      log.debug(`Found deb file for release: ${deb}`)
      this.data.file = path.join(p, deb)

      const folder = await this.require('Extract', this.data.file)

      await Promise.all([
        this.require('AppData', path.join(folder, 'usr/share/metainfo')),
        this.require('Desktop', path.join(folder, 'usr/share/applications'))
      ])

      this.data.file = await this.require('Pack', folder)
    }
  }
}
