/**
 * houston/src/worker/task/upload/index.ts
 * Responsible for uploading all the end results to third party services
 */

import { WrapperTask } from '../wrapperTask'

import { UploadLog } from './log'
import { UploadPackage } from './package'

export class Upload extends WrapperTask {
  /**
   * All of the upload tasks we should run
   *
   * @var {Task[]}
   */
  public get tasks () {
    return [
      UploadPackage,
      UploadLog
    ]
  }
}
