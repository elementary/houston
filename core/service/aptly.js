/**
 * core/service/aptly.js
 * Repository handles with aptly api
 *
 * @exports {Function} QueryReviewPackage
 * @exports {Function} PublishReviewPackage
 */

import Promise from 'bluebird'
import _ from 'lodash'

import { Config, Request, Log } from '~/app'

/**
 * QueryReviewPackage
 * Queries packages in the review repository and filters for version
 *
 * @param {String} dist - distribution of repository to query
 * @param {String} name - project / package name to query for
 * @param {String} version - project / package version
 * @returns {Array} - Packages found
 */
export async function QueryReviewPackage (dist, name, version) {
  if (!Config.aptly) {
    Log.verbose('Aptly is disabled. No packages found in space')
    return Promise.resolve([])
  }

  return Request
  .get(`${Config.aptly.url}/repos/${dist}-${Config.aptly.review}/packages?q=${name}`)
  .then(packages => JSON.parse(packages.text))
  .then(packages => {
    return _.filter(packages, pkg => pkg.indexOf(version) !== -1)
  }, err => {
    Log.error(err)
    return Promise.reject('Unable to contact repository')
  })
}

/**
 * PublishReviewPackage
 * Moves packages from review repository to stable repository. All steps are
 * done based on the distribution for the project. Here's the order:
 * 1) Query for all packages in testing repo
 * 2) Copy packages from testing repo to stable repo
 * 3) Remove packages from testing repo
 * 4) Create a snapshot of the stable repo name like 'sid-vocal-2.1.0'
 * 5) Update published repo with snapshot of stable
 *
 * @param {Object} cycle - Database cycle object
 */
export async function PublishReviewPackage (cycle) {
  if (!Config.aptly) {
    Log.verbose('Aptly is disabled. Assuming the publish would have been successful')
    return Promise.resolve()
  }

  const project = await cycle.getProject()
  const release = await cycle.getRelease()

  if (release == null) {
    Log.warn('Trying to release a non release cycle. Failing')
    return Promise.reject('Trying to release a non release cycle. Failing')
  }

  MoveToStable(cycle)
  .then(PublishStable(cycle))
  .catch(err => {
    Log.error(`Failed to publish ${project.name}`)
    Log.error(err)
    return Promise.reject(`Failed to publish ${project.name}`)
  })
}

/**
 * MoveToStable
 * Moves packages from review repository to stable repository. Here's the order:
 * 1) Query for all packages in testing repo
 * 2) Copy packages from testing repo to stable repo
 * 3) Remove packages from testing repo
 *
 * @param {Object} cycle - Database cycle object
 */
export async function MoveToStable (cycle) {
  if (!Config.aptly) {
    Log.verbose('Aptly is disabled. Going to assume the move to stable was a success')
    return Promise.resolve()
  }

  const project = await cycle.getProject()
  const release = await cycle.getRelease()

  if (release == null) {
    Log.warn('Only release cycles will have builds. Preemptively failing')
    return Promise.reject('Only release cycles will have builds. Preemptively failing')
  }

  const version = await project.getVersion()

  return Promise.each(project.distributions, async dist => {
    const packages = await QueryReviewPackage(dist, project.name, version)

    if (packages.length < 1) {
      Log.verbose(`Aptly could not find any package for ${project.name}`)
      return Promise.resolve()
    }

    return Request
    .post(`${Config.aptly.url}/repos/${dist}-${Config.aptly.stable}/packages`)
    .send({
      PackageRefs: packages
    })
    .then(() => {
      return Request
      .del(`${Config.aptly.url}/repos/${dist}-${Config.aptly.review}/packages`)
      .send({
        PackageRefs: packages
      }).promise()
    })
    .catch(err => {
      Log.error(err)
      return Promise.reject(`Error occured while trying to move ${project.name} to stable`)
    })
  })
  .catch(err => {
    Log.error(err)
    return Promise.reject('Unable to contact repository')
  })
}

/**
 * PublishStable
 * Replaces current published snapshot with newly created snapshot
 * 1) Create a snapshot of the stable repo name like 'sid-vocal-2.1.0'
 * 2) Update published repo with snapshot of stable
 *
 * @param {Object} cycle - Database cycle object
 */
export async function PublishStable (cycle) {
  if (!Config.aptly) {
    Log.verbose('Aptly is disabled. Going to assume the publish was a success')
    return Promise.resolve()
  }

  const project = await cycle.getProject()
  const release = await cycle.getRelease()

  if (release == null) {
    Log.warn('Only release cycles will have builds. Preemptively failing')
    return Promise.reject('Only release cycles will have builds. Preemptively failing')
  }

  const version = await project.getVersion()

  return Promise.each(project.distributions, async dist => {
    return Request
    .post(`${Config.aptly.url}/repos/${dist}-${Config.aptly.stable}/snapshots`)
    .send({
      Name: `${dist}-${project.name}-${version.replace('.', '-')}`
    }).promise()
    .then(() => {
      return Request
      .put(`${Config.aptly.url}/publish//${dist}`)
      .send({
        Snapshots: [{
          Componenet: 'main',
          Name: `${dist}-${project.name}-${version.replace('.', '-')}`
        }]
      }).promise()
    })
    .catch(err => {
      Log.error(err)
      return Promise.reject('Error occured while trying to publish new snapshot')
    })
  })
  .catch(err => {
    Log.error(err)
    return Promise.reject('Unable to contact repository')
  })
}
