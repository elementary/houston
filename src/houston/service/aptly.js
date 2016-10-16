/**
 * houston/service/aptly.js
 * Repository handles with aptly api
 *
 * @exports {Function} upload - Uploads a package to aptly server
 * @exports {Function} review - Sends package to review repo
 * @exports {Function} stable - Sends package to stable repo
 */

import config from 'lib/config'
import Log from 'lib/log'
import Mistake from 'lib/mistake'
import request from 'lib/request'

const log = new Log('service:aptly')

/**
 * ensureEnabled
 * Ensures that aptly configuration is set
 *
 * @return {Void}
 * @throws {Mistake} - if aptly is currently disabled
 */
function ensureEnabled () {
  if (!config.aptly || !config.aptly.url) {
    throw new Mistake(503, 'Aptly is currently disabled')
  }
}

/**
 * upload
 * Uploads a package to aptly in review repository
 *
 * @param {String} project - name of project package being uploaded
 * @param {String} arch - package architecture
 * @param {String} version - semver version of pacakge
 * @param {Buffer} file - actual file to upload
 * @returns {Void}
 */
export function upload (project, arch, version, file) {
  ensureEnabled()

  return request
  .post(`${config.aptly.url}/files`)
  .attach('file', file, `${project}_${arch}_${version}.deb`)
  .then((data) => {
    log.debug(`Added ${log.lang.s('package', data.body)} of ${project} to repository`)

    return
  })
}

/**
 * ingest
 * Adds packages from upload directory to repository
 *
 * @param {String} project - name of project package being uploaded
 * @param {String} arch - package architecture
 * @param {String} version - semver version of pacakge
 * @returns {Array} - Aptly package keys
 */
const ingest = (project, arch, version) => {
  ensureEnabled()

  return Promise.try(() => {
    return request.post(`${config.aptly.url}/repos/${config.aptly.review}/file/${project}_${arch}_${version}.deb`)
    .then((data) => data.body.Report.Added)
    .catch((error) => {
      if (error.statusCode === 404) {
        throw new Mistake(500, 'Repository does not exist in aptly')
      }

      throw new Mistake(500, error)
    })
  })
  .then((added) => [].concat(added))
  .then((data) => {
    log.debug(`Ingested ${log.lang.s('package', data.length)} of ${project}`)

    return request
    .get(`${config.aptly.url}/repos/${config.aptly.review}/packages`)
    .query({ q: `${project} (= ${version})` })
    .then((data) => data.body)
  })
}

/**
 * add
 * Adds packages to repository
 *
 * @param {Array} pkg - Package keys
 * @param {String} repo - Name of repository to add packages too
 * @returns {Promise} - Empty promise of success
 */
const add = (pkg, repo) => {
  ensureEnabled()

  return request
  .post(`${config.aptly.url}/repos/${repo}/packages`)
  .send({
    PackageRefs: pkg
  })
  .then((d) => d, (error) => {
    if (error.statusCode === 400) {
      throw new Mistake(500, 'Package conflicts with existing package in aptly')
    } else if (error.statusCode === 404) {
      throw new Mistake(500, 'Repository or key does not exist in aptly')
    }

    throw new Mistake(500, error)
  })
}

/**
 * remove
 * Removes packages from repository
 *
 * @param {Array} pkg - Package keys
 * @param {String} repo - Name of repository to remove packages from
 * @returns {Promise} - Empty promise of success
 */
const remove = (pkg, repo) => {
  ensureEnabled()

  return request
  .delete(`${config.aptly.url}/repos/${repo}/packages`)
  .send({
    PackageRefs: pkg
  })
  .then((d) => d, (error) => {
    if (error.statusCode === 404) {
      throw new Mistake(500, 'Repository does not exist in aptly')
    }

    throw new Mistake(500, error)
  })
}

/**
 * move
 * Moves packages from repository to repository. Here's the order:
 * 1) Add packages to second repo
 * 2) Remove packages from first repo
 *
 * @param {Array} pkg - Package keys
 * @param {String} repoFrom - Name of repo move packages from
 * @param {String} repoTo - Name of repo to move packages to
 * @returns {Promise} - Empty promise of success
 */
const move = (pkg, repoFrom, repoTo) => {
  ensureEnabled()

  return add(pkg, repoTo)
  .then(() => remove(pkg, repoFrom))
}

/**
 * publish
 * Takes a snapshot of repo and publishes it
 *
 * @param {String} repo - Package keys
 * @param {Array} dist - Distributions to publish
 * @returns {Promise} - Empty promise of success
 */
const publish = async (repo, dist) => {
  ensureEnabled()

  const name = new Date()
  .getTime()
  .toString()

  await request
  .post(`${config.aptly.url}/repos/${repo}/snapshots`)
  .send({
    Name: name,
    Description: 'Automated Houston publish'
  })
  .then(() => Promise.each(dist, (d) => {
    return request
    .put(`${config.aptly.url}/publish/${repo}/${d}`)
    .send({
      Snapshots: [{
        Component: 'main',
        Name: name
      }],
      Signing: {
        Batch: true,
        Passphrase: config.aptly.passphrase
      }
    })
    .then((d) => d, (error) => {
      throw new Mistake(500, error)
    })
  }), (error) => {
    if (error.statusCode === 400) {
      throw new Mistake(500, 'Snapshot already exists in aptly', error)
    } else if (error.statusCode === 404) {
      throw new Mistake(500, 'Repository does not exist in aptly', error)
    }

    throw new Mistake(500, error)
  })
}

/**
 * review
 * 1) Adds packages to review repository
 * 2) Publishes review repository
 *
 * @param {String} project - name of project package being uploaded
 * @param {String} version - package version
 * @param {Array} arch - architecture of pacakges to publish
 * @param {Array} dist - Distributions to publish to
 * @returns {Array} - Package keys successfully moved
 */
export async function review (project, version, arch, dist) {
  ensureEnabled()

  const keys = await Promise.each(arch, (arch) => {
    return ingest(project, arch, version)
  })

  await publish(config.aptly.review, dist)

  return keys
}

/**
 * stable
 * 1) Move package from review to stable
 * 2) Publishes stable repository
 *
 * @param {Array} pkg - Package keys
 * @param {Array} dist - Distributions to publish to
 * @returns {Promise} - Empty promise of success
 */
export function stable (pkg, dist) {
  ensureEnabled()

  return move(pkg, config.aptly.review, config.aptly.stable)
  .then(() => publish(config.aptly.stable, dist))
}
