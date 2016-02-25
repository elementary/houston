/**
 * core/service/aptly.js
 * Repository handles with aptly api
 *
 * @exports {Function} PublishReviewPackage
 */

import { Config, Request, Log } from '~/app'

/**
 * PublishReviewPackage
 * Moves packages from review repository to stable repository. All steps are
 * done based on the distribution for the project. Here's the order:
 * 1) Query for all packages in testing repo
 * 2) Copy packages from testing repo to stable repo
 * 3) Remove packages from testing repo
 * 4) Create a snapshot of the stable repo
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
  const version = await project.getVersion()
  const query = `${project.name} ${project.getVersion()}`

  return Promise.each(project.distributions)
  .map(async dist => {
    const packages = await Request
    .get(`${Config.aptly.url}/repos/${dist}-${Config.aptly.review}/packages?q=${query}`)

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
      })
    })
    .then(() => {
      return Request
      .post(`${Config.aptly.url}/repos/${Config.aptly.stable}/snapshots`)
      .send({
        Name: `${dist}-${project.name}-${version.replace('.', '-')}`
      })
    })
    .then(() => {
      return Request
      .put(`${Config.aptly.url}/publish//${dist}`)
      .send({
        Snapshots: [{
          Componenet: 'main',
          Name: `${dist}-${project.name}-${version.replace('.', '-')}`
        }]
      })
    })
  })
  .then(() => true)
}
