/**
 * service/aptly.js
 * Repository handles with aptly api
 * @flow
 *
 * @exports {Function} upload - Uploads a package to aptly's upload directory
 * @exports {Function} del - Removes a package from the aptly upload directory
 * @exports {Function} ingest - Adds packages from upload directory to repository
 * @exports {Function} add - Adds packages to repository
 * @exports {Function} remove - Removes packages from repository
 * @exports {Function} move - Moves packages from repository to repository.
 * @exports {Function} publish - Publishes a repository
 * @exports {Function} review - Sends package to review repo
 * @exports {Function} stable - Sends package to stable repo
 */

import { domain } from 'lib/request'
import * as error from 'lib/error/service'
import config from 'lib/config'
import Log from 'lib/log'

const log = new Log('service:aptly')

const arch = 'amd64'
const dist = 'xenial'

const api = domain(config.aptly.url)
.use((req) => {
  req.set('User-Agent', 'elementary-houston')
})

export default api

/**
 * errorCheck
 * Checks generatic Aptly status codes for a more descriptive error
 *
 * @param {Object} err - superagent error to check
 * @param {Object} [res] - Aptly response object
 * @returns {ServiceError} - a parsed error from Aptly
 */
const errorCheck = (err: Object, res: ?Object): error.ServiceError => {
  if (err.status === 401) {
    log.info(`Bad credentials`)
    return new error.ServiceError('Aptly', 'Bad Credentials')
  }

  if (res != null) {
    if (res.body != null && res.body[0] != null && res.body[0].error) {
      log.error(res.body[0].error)

      return new error.ServiceRequestError('Aptly', res.status, res.body[0].error)
    }

    log.error(err.toString())
    return new error.ServiceRequestError('Aptly', res.status, err.toString())
  }

  log.error(err)
  return new error.ServiceError('Aptly', err.toString())
}

/**
 * upload
 * Uploads a package to aptly's upload directory
 *
 * @param {String} project - Name of project package being uploaded
 * @param {String} version - Semver version of pacakge
 * @param {String} file - Full path for file to upload
 *
 * @async
 * @returns {String[]} - List of files uploaded
 */
export function upload (project: string, version: string, file: string): Promise<string[]> {
  return api
  .post(`/files/${project}`)
  .attach('file', file, `${version}_${arch}.deb`)
  .then((data) => data.body)
  .catch((err, res) => {
    throw errorCheck(err, res)
  })
}

/**
 * del
 * Removes a package from the aptly upload directory
 *
 * @param {String} file - Path to file to remove from aptly directory
 *
 * @async
 * @returns {Object} - Aptly response object
 */
export function del (file: string): Promise<Object> {
  return api
  .delete(`/files/${file}`)
  .then((data) => data.body)
  .catch((err, res) => {
    throw errorCheck(err, res)
  })
}

/**
 * get
 * Finds package keys for package
 *
 * @param {String} repo - Name of repository to get package keys from
 * @param {String} project - Name of project package being uploaded
 * @param {String} version - Semver version of pacakge
 *
 * @async
 * @returns {String[]} - A list of package keys
 */
export function get (repo: string, project: string, version: string): Promise<string[]> {
  return api
  .get(`/repos/${repo}/packages`)
  .query({ q: `${project} (= ${version})` })
  .then((data) => data.body)
  .catch((err, res) => {
    throw errorCheck(err, res)
  })
}

/**
 * ingest
 * Adds packages from upload directory to repository
 *
 * @param {String} repo - Repo name to add packages to
 * @param {String} project - Name of project package being uploaded
 * @param {String} version - Semver version of pacakge
 *
 * @async
 * @returns {String[]} - Aptly package keys
 */
export async function ingest (repo: string, project: string, version: string): Promise<string[]> {
  await api
  .post(`/repos/${repo}/file/${project}/${version}_${arch}.deb`)
  .then((data) => data.body.Report.Added)
  .catch((err, res) => {
    throw errorCheck(err, res)
  })

  await del(`${project}/${version}_${arch}.deb`)

  return api
  .get(`/repos/${repo}/packages`)
  .query({ q: `${project} (= ${version})` })
  .then((data) => data.body)
}

/**
 * add
 * Adds packages to repository
 *
 * @param {String} repo - Name of repository to add packages to
 * @param {String[]} pkg - Package keys
 *
 * @async
 * @returns {Object} - Aptly response object
 */
export function add (repo: string, pkg: string[]): Promise<Object> {
  return api
  .post(`/repos/${repo}/packages`)
  .send({ PackageRefs: pkg })
  .then((data) => data.body)
  .catch((err, res) => {
    throw errorCheck(err, res)
  })
}

/**
 * remove
 * Removes packages from repository
 *
 * @param {String} repo - Name of repository to remove packages from
 * @param {String[]} pkg - Package keys
 *
 * @async
 * @returns {Object} - Aptly response object
 */
export function remove (repo: string, pkg: string[]): Promise<Object> {
  return api
  .delete(`/repos/${repo}/packages`)
  .send({ PackageRefs: pkg })
  .then((data) => data.body)
  .catch((err, res) => {
    throw errorCheck(err, res)
  })
}

/**
 * move
 * Moves packages from repository to repository.
 *
 * @param {String} from - Name of repository to move from
 * @param {String} to - Name of repository to move to
 * @param {String[]} pkg - Package key
 *
 * @async
 * @returns {Void}
 */
export async function move (from: string, to: string, pkg: string[]): Promise<> {
  await add(to, pkg)
  await remove(from, pkg)
}

/**
 * publish
 * Publishes a local repository
 *
 * @param {String} repo - Name of repository to publish
 *
 * @async
 * @returns {String} - Name of the repo published
 */
export function publish (repo: string): Promise<string> {
  return api
  .put(`/publish/${repo}/${dist}`)
  .send({
    Signing: {
      Batch: true,
      Passphrase: config.aptly.passphrase
    }
  })
  .then((data) => data.body.Sources[0].Name)
  .catch((err, res) => {
    throw errorCheck(err, res)
  })
}

/**
 * review
 * Uploads a package to aptly review directory and publishes review repo
 *
 * @param {String} project - Name of project package being uploaded
 * @param {String} version - Semver version of pacakge
 * @param {String} file - Full path for file to upload
 *
 * @async
 * @returns {String[]} - List of packages uploaded
 */
export async function review (project: string, version: string, file: string): Promise<string[]> {
  await upload(project, version, file)
  const keys = await ingest(config.aptly.review, project, version)

  await publish(config.aptly.review)

  return keys
}

/**
 * stable
 * Moves a package from review to stable then publishes the repo
 *
 * @param {String[]} pkg - Package keys
 *
 * @async
 * @returns {String} - Name of the repo published
 */
export async function stable (pkg: string[]): Promise<string> {
  await move(config.aptly.review, config.aptly.stable, pkg)
  return publish(config.aptly.stable)
}
