/**
 * houston/src/worker/task/debian/control.ts
 * Updates, lints, and validates the Debian control file.
 *
 * @exports {Function} run - Update, lint and validate control file.
 */

import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'

import { Worker } from '../../worker'

/**
 * readFile
 * Reads the debian control file and parses it to a string.
 *
 * @async
 * @param {string} file - File location to Debian control file
 * @return {string} - Local liftoff cache folder
 */
export async function readFile (path: string): Promise<object> {
  await fs.ensureFile(path)

  const output = {}
  const raw = await fs.readFile(path, { encoding: 'utf-8' })








  return output
}
