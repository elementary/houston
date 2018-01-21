/**
 * houston/src/worker/task/task.ts
 * Some worker logic.
 *
 * @exports {Class} Task
 */

import { Workable } from '../type'
import { Worker } from '../worker'

export class Task implements Workable {
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
    this.worker.emit(`task:${this.constructor.name}:start`)
    //
    this.worker.emit(`task:${this.constructor.name}:end`)
  }
}
