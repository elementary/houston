/**
 * houston/service/aptly.js
 * Repository handles with aptly api
 *
 * @exports {Function} review - Sends package to review repo
 * @exports {Function} stable - Sends package to stable repo
 */

import config from '~/lib/config'
import log from '~/lib/log'
import Mistake from '~/lib/mistake'
import request from '~/lib/request'

/**
 * upload
 * Uploads a package to aptly in review repository (Does not publish!)
 *
 * @param {String} pkg - Project / package name
 * @param {String} version - Package version
 * @returns {Array} - Aptly package keys
 */
const upload = (pkg, version) => {
  if (!config.aptly) {
    throw new Mistake(503, 'Aptly is currently disabled')
  }

  return request
  .post(`${config.aptly.url}/repos/${config.aptly.review}/file/${pkg}-${version}`)
  .then((data) => {
    log.silly(`Added ${log.lang.s('package', data.body.Report.Added)}`)

    return request
    .get(`${config.aptly.url}/repos/${config.aptly.review}/packages`)
    .query({ q: `${pkg} (= ${version})` })
    .then((data) => data.body)
  })
  .catch((error) => {
    if (error.statusCode === 404) {
      throw new Mistake(500, 'Repository does not exist in aptly')
    }

    throw new Mistake(500, error)
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
  if (!config.aptly) {
    throw new Mistake(503, 'Aptly is currently disabled')
  }

  return request
  .post(`${config.aptly.url}/repos/${repo}/packages`)
  .send({
    PackageRefs: pkg
  })
  .catch((error) => {
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
  if (!config.aptly) {
    throw new Mistake(503, 'Aptly is currently disabled')
  }

  return request
  .delete(`${config.aptly.url}/repos/${repo}/packages`)
  .send({
    PackageRefs: pkg
  })
  .catch((error) => {
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
  if (!config.aptly) {
    throw new Mistake(503, 'Aptly is currently disabled')
  }

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
const publish = (repo, dist) => {
  if (!config.aptly) {
    throw new Mistake(503, 'Aptly is currently disabled')
  }

  const name = new Date().getTime().toString()

  return request
  .post(`${config.aptly.url}/repos/${repo}/snapshots`)
  .send({
    Name: name,
    Description: 'Automated Houston publish'
  })
  .catch((error) => {
    if (error.statusCode === 400) {
      throw new Mistake(500, 'Snapshot already exists in aptly')
    } else if (error.statusCode === 404) {
      throw new Mistake(500, 'Repository does not exist in aptly')
    }

    throw new Mistake(500, error)
  })
  .then(() => Promise.each(dist, d => {
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
  }))
}

/**
 * review
 * 1) Uploads package to aptly
 * 2) Adds packages to review repository
 * 3) Publishes review repository
 *
 * @param {String} pkg - Project / package name
 * @param {String} version - Package version
 * @param {Array} dist - Distributions to publish to
 * @returns {Array} - Package keys successfully moved
 */
export function review (pkg, version, dist) {
  if (!config.aptly) {
    throw new Mistake(503, 'Aptly is currently disabled')
  }

  return upload(pkg, version)
  .then((keys) => {
    return publish(config.aptly.review, dist)
    .then(() => keys)
  })
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
  if (!config.aptly) {
    throw new Mistake(503, 'Aptly is currently disabled')
  }

  return move(pkg, config.aptly.review, config.aptly.stable)
  .then(() => publish(config.aptly.stable, dist))
}
