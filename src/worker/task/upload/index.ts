/**
 * houston/src/worker/task/upload/index.ts
 * Responsible for uploading all the end results to third party services
 */

import { WrapperTask } from '../wrapperTask'

export class Upload extends WrapperTask {
  /**
   * All of the upload tasks we should run
   *
   * @var {Task[]}
   */
  public tasks = []
}
