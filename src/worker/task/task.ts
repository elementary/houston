/**
 * houston/src/worker/task/task.ts
 * Some worker logic.
 *
 * @exports {Class} Task
 */

import { Workable } from '../workable'
import { Worker } from '../worker'

export class Task implements Workable {

  /**
   * A list used files used in this Task
   *
   * @var {string[]}
   */
  public files = ['*']

  /**
   * The current running worker
   *
   * @var {Worker}
   */
  public worker: Worker

  /**
   * Creates a new Task
   *
   * @param {Worker} worker
   */
  constructor (worker: Worker) {
    this.worker = worker
  }

  /**
   * Does logic.
   *
   * @async
   * @return {void}
   */
  public async run () {
    //
  }
}
