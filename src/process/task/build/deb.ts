/**
 * houston/src/process/task/build/deb.ts
 * Builds deb files.
 *
 * @exports {Function} run - Builds deb files
 */

import { Process } from '../../process'

/**
 * liftoff
 * Starts a docker container mounted to the debian build folder, to build the
 * actual deb file.
 *
 * @async
 * @param {string} folder - The debian build file
 * @param {string} [dist] - Distribution to build for
 * @param {string} [arch] - The architecture to build for
 *
 * @throws {Error}
 * @return {void}
 */
export async function liftoff (folder: string, dist = 'xenial', arch = 'amd64'): Promise<void> {
  console.log(folder)
}

/**
 * run
 * Builds a deb file
 *
 * @param {Process} process - The current running process class
 * @param {string} [dist] - Distribution to build for
 * @param {string} [arch] - The architecture to build for
 * @return {string} - Full path to build deb file
 */
export async function run (process: Process, dist = 'xenial', arch = 'amd64'): Promise<string> {
  console.log(process, dist, arch)

  await liftoff()

  return ''
}
