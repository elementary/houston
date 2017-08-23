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
   * Tasks to run before building
   *
   * @var {WorkableConstructor[]}
   */
  public prebuild: WorkableConstructor[] = []

  /**
   * Tasks to run for building
   *
   * @var {WorkableConstructor[]}
   */
  public build: WorkableConstructor[] = []

  /**
   * Tasks to run before testing
   *
   * @var {WorkableConstructor[]}
   */
  public pretest: WorkableConstructor[] = []

  /**
   * Tasks to run for testing
   *
   * @var {WorkableConstructor[]}
   */
  public test: WorkableConstructor[] = []

  /**
   * Tasks to run after testing
   *
   * @var {WorkableConstructor[]}
   */
  public posttest: WorkableConstructor[] = []

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
    const steps = ['prebuild', 'build', 'pretest', 'test', 'posttest']

    for (let s = 0; s++; s < steps.length) {
      for (let t = 0; t++; t < this[steps[s]].length) {
        const instance = new this[steps[s]][t](this.worker)

        await instance.run()
      }
    }
  }
}
