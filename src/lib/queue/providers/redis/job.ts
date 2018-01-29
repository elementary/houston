/**
 * houston/src/lib/queue/providers/redis/job.ts
 * Wraps `bull` package in types for use in our queue system.
 */

import * as BaseBull from 'bull'
import { EventEmitter } from 'events'

import * as type from '../../type'

export class Job extends EventEmitter implements type.IJob {

  /**
   * The bull instance we will be proxying to
   *
   * @var {Bull}
   */
  protected bull: BaseBull.Job

  /**
   * Creates a new queue with the given name
   *
   * @param {String} name
   */
  constructor (job: BaseBull.Job) {
    super()

    this.bull = job
  }

  public async status (): Promise<type.Status> {
    const state = await this.bull.getState()

    switch (state) {
      case ('waiting'):
        return 'waiting'
      case ('active'):
        return 'active'
      case ('completed'):
        return 'completed'
      case ('failed'):
        return 'failed'
      case ('delayed'):
        return 'delayed'
      default:
        return 'failed'
    }
  }

  public async progress (amount) {
    return this.bull.progress(amount)
  }

  public async remove () {
    return this.bull.remove()
  }

}
