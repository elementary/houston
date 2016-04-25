/**
 * houston/controller/hook/strongback.js
 * Handles all communcation from atc strongback connections
 */

import atc from '~/houston/service/atc'
import Cycle from '~/houston/model/cycle'

/**
 * Receives data from build
 *
 * @param {Object} - {
 *   {String} arch - architecture to build (amd64)
 *   {String} dist - distribution to build (xenial)
 *   {Error} error - error while trying to build (only exists on failure to run build)
 *   {String} owner - repo owner on github (vocalapp)
 *   {String} repo - repo name on github (vocal)
 *   {Boolean} success - true if successful build (only exists on build)
 *   {String} tag - git tag to checkout
 *   {String} version - package version
 *   {Array} files - [{
 *     {String} name - file name
 *     {String} data - file data
 *   }]
 * }
 */
atc.on('build:finish', async (data) => {
  const build = await Cycle.findOne({
    
  })

  if (data.errors > 0) {
    cycle.update({ '_status': 'FAIL' })
  } else if (cycle.type === 'RELEASE') {
    cycle.build()
    .then(() => cycle.update({ '_status': 'BUILD' }))
  }

  // TODO: update project information
  const project = await cycle.getProject()
  for (const i in data.issues) {
    project.postIssue(data.issues[i])
  }
})
