/*
 * flightcheck/pipes/Elementary/Aptly/index.js
 * Publishes builds to elementary's aptly repo
 *
 * @exports {Pipe} - Post to
 */

import _ from 'lodash'
import path from 'path'

import config from '~/lib/config'
import log from '~/lib/log'
import Pipe from '~/flightcheck/pipes/pipe'
import request from '~/lib/request'

/**
 * aptlyerr
 * Helps log aptly errors
 *
 * @param {String} str - string to log in error
 * @param {Object} err - The request error object
 */
const aptlyerr = (str, err) => {
  log.error(str)

  if (err.response != null && err.response.body[0] != null && err.response.body[0].error != null) {
    log.error(err.response.body[0].error)
  } else {
    log.error(err)
  }
}

/*
 * GitHubRelease
 * Post files to GitHub release
 *
 * @extends Pipe
 */
export default class ElementaryAptly extends Pipe {

  /**
   * Creates a new Pipe
   *
   * @param {Pipeline} pipeline - Current running Pipeline
   */
  constructor (pipeline) {
    super(pipeline)

    // TODO: we need to filter by architectures
    this.data.archs = ['amd64'] // elementary architectures we publish for
    this.data.dists = ['xenial'] // elementary repository distributions we publish for

    this.data.publishedFiles = [] // all file paths we published
    this.data.publishedKeys = [] // all aptly keys we published
  }

  /**
   * code
   * Create GitHub Issues
   */
  async code (files = []) {
    files = files.filter((f) => (path.extname(f) === '.deb'))

    log.debug(`ElementaryAptly has ${files.length} files to publish`)

    if (files.length < 1) return

    if (!config.aptly) return this.log('debug', 'Elementary/Aptly/disabled.md')

    const apphub = await this.require('AppHub')

    if (!apphub.endpoints.elementary) {
      log.debug('ElementaryAptly endpoint is disabled in apphub file')
      return this.log('debug', 'Elementary/Aptly/disabled.md')
    }

    let existingKeys = null
    try {
      log.debug('ElementaryAptly is trying to check for existing packages')

      existingKeys = await request
      .get(`${config.aptly.url}/repos/${config.aptly.review}/packages`)
      .query({
        q: `${this.pipeline.build.name} (= ${this.pipeline.build.version})`
      })
      .then((data) => data.body)

      if (!_.isArray(existingKeys)) throw new Error('Unable to grab array of exisiting keys')
    } catch (error) {
      aptlyerr('ElementaryAptly encountered error while grabbing exisiting keys', error)
      return this.log('error', 'Elementary/Aptly/api.md')
    }

    if (existingKeys.length > 0) {
      log.debug('ElementaryAptly has detected this project and version are already uploaded')
      return this.log('warn', 'Elementary/Aptly/existing.md')
    }

    try {
      log.debug(`ElementaryAptly is uploading ${files} files to aptly`)

      let req = request
      .post(`${config.aptly.url}/files/${this.pipeline.build.name}`)

      files.forEach((file) => {
        req = req.attach(file, path.join(this.pipeline.build.dir, file))
      })

      await req

      this.data.publishedFiles = files
    } catch (error) {
      aptlyerr('ElementaryAptly encountered an error while posting files to repo', error)
      return this.log('error', 'Elementary/Aptly/api.md')
    }

    try {
      log.debug('ElementaryAptly is grabbing package keys')

      await request
      .post(`${config.aptly.url}/repos/${config.aptly.review}/file/${this.pipeline.build.name}`)

      this.data.publishedKeys = await request
      .get(`${config.aptly.url}/repos/${config.aptly.review}/packages`)
      .query({
        q: `${this.pipeline.build.name} (= ${this.pipeline.build.version})`
      })
      .then((data) => data.body)
    } catch (error) {
      aptlyerr('ElementaryAptly encountered an error while adding files to repo', error)
      return this.log('error', 'Elementary/Aptly/api.md')
    }

    try {
      log.debug('ElementaryAptly is creating a new snapshot')

      const timestamp = new Date()
      .getTime()
      .toString()

      await request
      .post(`${config.aptly.url}/repos/${config.aptly.review}/snapshots`)
      .send({
        Name: timestamp,
        Description: `${this.pipeline.build.name} version bump to ${this.pipeline.build.version}`
      })

      await Promise.each(this.data.dists, (dist) => {
        log.debug(`ElementaryAptly is updating snapshot for ${dist} repository`)

        return request
        .put(`${config.aptly.url}/publish/${config.aptly.review}/${dist}`)
        .send({
          Snapshots: [{
            Component: 'main',
            Name: timestamp
          }],
          Signing: {
            Batch: true,
            Passphrase: config.aptly.passphrase
          }
        })
      })
    } catch (error) {
      aptlyerr('ElementaryAptly encountered an error while publishing new snapshot', error)
      return this.log('error', 'Elementary/Aptly/api.md')
    }
  }
}
