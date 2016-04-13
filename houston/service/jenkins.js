/**
 * houston/service/jenkins.js
 * Handles requests to Jenkins server
 *
 * @exports {Function} getReleases - Returns mapped array of releases from GitHub project
 * @exports {Function} getProjects - Returns mapped array of projects
 * @exports {Function} sendLabel - Creates label for GitHub project issues
 * @exports {Function} sendIssue
 */

import config from '~/lib/config'
import log from '~/lib/log'
import Mistake from '~/lib/mistake'
import request from '~/lib/request'

/**
 * build
 * Sends a build to Jenkins
 *
 * @param {Object} parameter - Everything to sent to Jenkins
 * @returns {Number} - Queue number for build
 */
export function build (parameter) {
  if (!config.jenkins) {
    throw new Mistake(503, 'Jenkins is currently disabled')
  }

  return request
  .post(`${config.jenkins.url}/job/${config.jenkins.job}/build`)
  .send({ parameter })
  .then((data) => {
    console.log(data.body)
    return 1
  })
  .catch((error) => {
    throw new Mistake(500, 'Houston had a problem building', error)
  })
}

/**
 * log
 * Grabs log from Jenkins
 *
 * @param {Number} build - Build number in Jenkins
 * @returns {String} - Build log
 */
export function log (build) {
  if (!config.jenkins) {
    throw new Mistake(503, 'Jenkins is currently disabled')
  }

  return request
  .get(`${config.jenkins.url}/build/${config.jenkins.job}/${build}/consoleText`)
  .then((data) => data.body)
  .catch((error) => {
    throw new Mistake(500, 'Houston had a problem fetching build logs', error)
  })
}
