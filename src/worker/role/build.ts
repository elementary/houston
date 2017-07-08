/**
 * houston/src/worker/role/build.ts
 * Builds a package and edits contents for appcenter.
 */

import * as fs from 'fs-extra'
import * as path from 'path'

import { Process } from '../worker'

import { run as runBuildDeb } from '../task/build/deb'

/**
 * run
 * Runs the building
 *
 * @async
 * @param {Process} process - The process to use
 * @return {void}
 */
export async function run (process: Process) {
  await process.setup()

  const repositoryFolder = path.resolve(process.workspace, 'repository')
  const debFolder = path.resolve(process.workspace, 'build', 'deb')

  await fs.copy(repositoryFolder, debFolder)
  await runBuildDeb(process, debFolder)

  await process.teardown()
}
