/**
 * houston/test/utililty/worker/worker.ts
 * Helpful functions to test the worker process
 */

import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid'

import { Worker } from '../../../src/worker/worker'

export class TestWorker extends Worker {
  /**
   * Creates a new worker process
   *
   * @param {Config} config - The configuration to use
   * @param {Repository} repository - The repository to process on
   * @param {IContext} context - Storage for the worker information
   */
  constructor (config, repository, storage) {
    super(config, repository, storage)

    this.workspace = path.resolve(os.tmpdir(), 'houston-test/worker', uuid())
  }

  /**
   * Returns the full path of a file in the workspace
   *
   * @param {string} p
   * @return {string}
   */
  public get (p) {
    return path.resolve(this.workspace, p)
  }

  /**
   * Mocks files from the fixture worker directory to the current workspace
   *
   * @async
   * @param {String} from - Path relative to `houston/test/fixture/worker`
   * @param {String} to - Path relative to current workspace
   * @return {void}
   */
  public async mock (from, to) {
    const fullFrom = path.resolve(__dirname, '../../fixture/worker', from)

    return fs.copy(fullFrom, this.get(to), { overwrite: true })
  }

}
