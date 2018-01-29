/**
 * houston/src/worker/task/file/deb.ts
 * Tests debian packages for needed file paths
 */

import { WrapperTask } from '../wrapperTask'

export class FileDeb extends WrapperTask {
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
