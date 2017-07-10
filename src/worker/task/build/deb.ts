/**
 * houston/src/worker/task/build/deb.ts
 * Builds deb files.
 *
 * @exports {Function} run - Builds deb files
 */

import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'

import { Config } from '../../../lib/config/class'
import { Docker } from '../../docker'
import { Worker } from '../../worker'

/**
 * liftoffCache
 * Sets up the liftoff cache for faster builds.
 *
 * @async
 * @return {string} - Local liftoff cache folder
 */
export async function liftoffCache (): Promise<string> {
  const cacheFolder = path.resolve(os.tmpdir(), 'liftoff')

  await fs.ensureFolder(cacheFolder)

  return cacheFolder
}

/**
 * liftoffError
 * Combs through a liftoff log for errors.
 *
 * @async
 * @return {Error}
 */
export async function liftoffError (log: string): Promise<Error> {
  return new Error(`errors in ${log}`)
}

/**
 * liftoff
 * Starts a docker container mounted to the debian build folder, to build the
 * actual deb file.
 *
 * @async
 * @param {Worker} worker - The worker using liftoff
 * @param {string} [dist] - Distribution to build for
 * @param {string} [arch] - The architecture to build for
 *
 * @throws {Error}
 * @return {void}
 */
export async function liftoff (worker: Worker, dist = 'xenial', arch = 'amd64'): Promise<void> {
  const docker = new Docker(worker.config, 'liftoff')

  const dockerExists = await docker.exists()
  if (dockerExists === false) {
    const dockerFolder = path.resolve(__dirname, 'docker')
    await docker.create(dockerFolder)
  }

  docker.log = path.resolve(worker.workspace, 'liftoff.log')

  const cacheFolder = await liftoffCache()
  const liftoffFolder = path.resolve(worker.workspace, 'build', 'deb')
  docker.mount(cacheFolder, 'var/cache/liftoff')
  docker.mount(liftoffFolder, '/tmp/liftoff')

  const exit = await docker.run(`-a ${arch} -d ${dist} -o /tmp/liftoff`, {
    Privileged: true // Liftoff uses chroot, so we need higher permissions.
  })

  if (exit !== 0) {
    throw liftoffError(docker.log)
  }
}

/**
 * run
 * Builds a deb file
 *
 * @param {Worker} worker - The current running worker class
 * @param {string} [dist] - Distribution to build for
 * @param {string} [arch] - The architecture to build for
 * @return {string} - Full path to build deb file
 */
export async function run (worker: Worker, dist = 'xenial', arch = 'amd64'): Promise<string> {
  console.log(worker, dist, arch)

  await liftoff(worker, dist, arch)

  return ''
}
