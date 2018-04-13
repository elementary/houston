/**
 * houston/src/worker/task/file/deb.ts
 * Tests debian packages for needed file paths
 */

import { WrapperTask } from '../wrapperTask'

import { FileDebBinary } from './deb/binary'
import { FileDebNonexistent } from './deb/nonexistent'

export class FileDeb extends WrapperTask {
  /**
   * Tasks to run for checking file paths
   *
   * @var {Task[]}
   */
  public get tasks () {
    return [
      FileDebBinary,
      FileDebNonexistent
    ]
  }
}
