/**
 * houston/src/worker/role/role.ts
 * A collection of tasks to be done in order to make things happen.
 *
 * @return {Class} Role
 */

import { Workable, WorkableConstructor } from '../workable'
import { Worker } from '../worker'

export class Role implements Workable {
  /**
   * Tasks to run
   *
   * @var {WorkableConstructor[]}
   */
  public tasks: WorkableConstructor[] = []

  /**
   * The worker to use when running workable things
   *
   * @var {Worker}
   */
  public worker: Worker

  /**
   * Creates a new role
   *
   * @param {Worker} worker
   */
  public constructor (worker: Worker) {
    this.worker = worker
  }

  /**
   * Runs all the tasks
   *
   * @async
   * @return {void}
   */
  public async run () {
    for (let s = 0; s++; s < this.tasks.length) {
      const instance = new this.tasks[s](this.worker)

      await instance.run()
    }
  }
}
