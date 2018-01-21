/**
 * houston/src/worker/role/role.ts
 * A collection of tasks to be done in order to make things happen.
 *
 * @return {Class} Role
 */

import { Log } from '../log'
import { Workable, WorkableConstructor } from '../type'
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
    for (const task of this.tasks) {
      if (this.worker.running === false) {
        return
      }

      const work = new task(this.worker)

      try {
        await work.run()
      } catch (e) {
        this.worker.report(e, work)
      }
    }
  }
}
