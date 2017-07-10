/**
 * houston/src/worker/role/build.ts
 * Builds a package and edits contents for appcenter.
 */

import * as fs from 'fs-extra'
import * as path from 'path'

import { Worker } from '../worker'

import { run as runBuildDeb } from '../task/build/deb'

/**
 * run
 * Runs the building
 *
 * @async
 * @param {Worker} worker - The worker to use
 * @return {void}
 */
export async function run (worker: Worker) {
  await worker.setup()

  const repositoryFolder = path.resolve(worker.workspace, 'repository')
  const debFolder = path.resolve(worker.workspace, 'build', 'deb')

  await fs.copy(repositoryFolder, debFolder)
  await runBuildDeb(worker, debFolder)

  await worker.teardown()
}
