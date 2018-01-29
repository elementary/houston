/**
 * houston/test/utililty/worker/worker.ts
 * Helpful functions to test the worker process
 */

import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'

import { Log } from '../../../src/worker/log'
import { Worker } from '../../../src/worker/worker'
import { storage } from './storage'

export class TestWorker extends Worker {

  /**
   * Overwrites the tempDir for testing workers
   *
   * @var {String}
   */
  protected static tempDir = path.resolve(os.tmpdir(), 'houston-test/worker')

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
    const fullTo = path.resolve(this.workspace, to)

    return fs.copy(fullFrom, fullTo, { overwrite: true })
  }

}
