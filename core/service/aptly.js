/**
 * core/service/aptly.js
 * Repository handles with aptly api
 *
 * @exports {Function} QueryReviewPackage
 * @exports {Function} PublishReviewPackage
 */

import Promise from 'bluebird'

import { Config, Request, Log } from '~/app'

/**
 * Upload
 * Uploads a package to aptly in review repository (Does not publish!)
 *
 * @param {String} pkg - Project / package name
 * @param {String} version - Package version
 * @returns {Array} - Aptly package keys
 */
export function Upload (pkg, version) {
  if (!Config.aptly) {
    Log.verbose(`Aptly is disabled. Not uploading '${pkg} - ${version}' package`)
    return Promise.resolve([])
  }

  return Request
  .post(`${Config.aptly.url}/repos/${Config.aptly.review}/file/${pkg}-${version}`)
  .then((data) => {
    Log.silly(`Added ${data.body.Report.Added.length} packages`)

    return Request
    .get(`${Config.aptly.url}/repos/${Config.aptly.review}/packages`)
    .query({ q: `${pkg} (= ${version})` })
    .then((data) => data.body)
  })
}

/**
 * Add
 * Adds packages to repository
 *
 * @param {Array} pkg - Package keys
 * @param {String} repo - Name of repository to add packages too
 * @returns {Promise} - Empty promise of success
 */
export function Add (pkg, repo) {
  if (!Config.aptly) {
    Log.verbose(`Aptly is disabled. Not adding packages to ${repo}`)
    Log.silly(pkg)
    return Promise.resolve()
  }

  return Request
  .post(`${Config.aptly.url}/repos/${repo}/packages`)
  .send({
    PackageRefs: pkg
  })
}

/**
 * Remove
 * Removes packages from repository
 *
 * @param {Array} pkg - Package keys
 * @param {String} repo - Name of repository to remove packages from
 * @returns {Promise} - Empty promise of success
 */
export function Remove (pkg, repo) {
  if (!Config.aptly) {
    Log.verbose(`Aptly is disabled. Not removing packages from ${repo}`)
    Log.silly(pkg)
    return Promise.resolve()
  }

  return Request
  .delete(`${Config.aptly.url}/repos/${repo}/packages`)
  .send({
    PackageRefs: pkg
  })
}

/**
 * Move
 * Moves packages from repository to repository. Here's the order:
 * 1) Add packages to second repo
 * 2) Remove packages from first repo
 *
 * @param {Array} pkg - Package keys
 * @param {String} repoFrom - Name of repo move packages from
 * @param {String} repoTo - Name of repo to move packages to
 * @returns {Promise} - Empty promise of success
 */
export function Move (pkg, repoFrom, repoTo) {
  if (!Config.aptly) {
    Log.verbose(`Aptly is disabled. Not moving packages from ${repoFrom} to ${repoTo}`)
    Log.silly(pkg)
    return Promise.resolve()
  }

  return Add(pkg, repoTo)
  .then(() => Remove(pkg, repoFrom))
}

/**
 * Publish
 * Takes a snapshot of repo and publishes it
 *
 * @param {String} repo - Package keys
 * @param {Array} dist - Distributions to publish
 * @returns {Promise} - Empty promise of success
 */
export function Publish (repo, dist) {
  if (!Config.aptly) {
    Log.verbose(`Aptly is disabled. Not publishing ${repo} repository`)
    return Promise.resolve()
  }

  const name = new Date().getTime().toString()

  return Request
  .post(`${Config.aptly.url}/repos/${repo}/snapshots`)
  .send({
    Name: name,
    Description: 'Automated Houston publish'
  })
  .then(() => Promise.each(dist, d => {
    return Request
    .put(`${Config.aptly.url}/publish/${repo}/${d}`)
    .send({
      Snapshots: [{
        Component: 'main',
        Name: name
      }],
      Signing: {
        Batch: true,
        Passphrase: Config.aptly.passphrase
      }
    })
  }))
}

/**
 * ReviewRepo
 * 1) Uploads package to aptly
 * 2) Adds packages to review repository
 * 3) Publishes review repository
 *
 * @param {String} pkg - Project / package name
 * @param {String} version - Package version
 * @param {Array} dist - Distributions to publish to
 * @returns {Array} - Package keys successfully moved
 */
export function ReviewRepo (pkg, version, dist) {
  if (!Config.aptly) {
    Log.verbose(`Aptly is disabled. Not publishing '${pkg} - ${version}' in review`)
    return Promise.resolve()
  }

  return Upload(pkg, version)
  .then((keys) => {
    return Publish(Config.aptly.review, dist)
    .then(() => keys)
  })
}

/**
 * StableRepo
 * 1) Move package from review to stable
 * 2) Publishes stable repository
 *
 * @param {Array} pkg - Package keys
 * @param {Array} dist - Distributions to publish to
 * @returns {Promise} - Empty promise of success
 */
export function StableRepo (pkg, dist) {
  if (!Config.aptly) {
    Log.verbose(`Aptly is disabled. Not publishing ${pkg[0]} in stable`)
    return Promise.resolve()
  }

  return Move(pkg, Config.aptly.review, Config.aptly.stable)
  .then(() => Publish(Config.aptly.stable, dist))
}
