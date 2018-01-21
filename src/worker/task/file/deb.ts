/**
 * houston/src/worker/task/file/deb.ts
 * Tests debian packages for needed file paths
 */

import { ParallelTask } from '../parallelTask'

export class FileDeb extends ParallelTask {
  /**
   * Tasks to run for checking file paths
   *
   * @var {Task[]}
   */
  public tasks = [
    require('./deb/binary').FileDebBinary,
    require('./deb/nonexistent').FileDebNonexistent
  ]
}
