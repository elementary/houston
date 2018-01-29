/**
 * houston/src/lib/queue/providers/redis/queue.ts
 * Wraps `bull` package in types for use in our queue system.
 */

import * as BaseBull from 'bull'
import { inject, injectable } from 'inversify'

import { Config } from '../../../config'
import * as type from '../../type'
import Job from './job'

@injectable()
export class Queue implements type.IQueue {

  /**
   * The configuration instance to use
   *
   * @var {Config}
   */
  @inject(Config)
  protected config: Config

  /**
   * The bull instance we will be proxying to
   *
   * @var {Bull}
   */
  protected bull: BaseBull.Queue

  /**
   * Creates a new queue with the given name
   *
   * @param {String} name
   */
  constructor (name: string) {
    const config = this.config.get('queue.connection')

    if (typeof config === 'object') {
      this.bull = new BaseBull(name, { redis: config })
    } else {
      this.bull = new BaseBull(name, config)
    }
  }

  public async send (data, opts) {
    const job = await this.bull.add(data, opts)

    return new Job(job)
  }

  public async handle (fn) {
    return this.bull.process(fn)
  }

  public async pause (local) {
    return this.bull.pause(local)
  }

  public async resume (local) {
    return this.bull.resume(local)
  }

  public async empty () {
    return this.bull.empty()
  }

  public async close () {
    return this.bull.close()
  }

  public async count (state = null) {
    switch (state) {
      case (null):
        return this.bull.count()
      case ('waiting'):
        return this.bull.getWaitingCount()
      case ('active'):
        return this.bull.getActiveCount()
      case ('completed'):
        return this.bull.getCompletedCount()
      case ('failed'):
        return this.bull.getFailedCount()
      case ('delayed'):
        return this.bull.getDelayedCount()
      default:
        return 0
    }
  }

  public async jobs (state) {
    switch (state) {
      case ('waiting'):
        return this.bull.getWaiting()
      case ('active'):
        return this.bull.getActive()
      case ('completed'):
        return this.bull.getCompleted()
      case ('failed'):
        return this.bull.getFailed()
      case ('delayed'):
        return this.bull.getDelayed()
      default:
        return []
    }
  }

  public onActive (fn) {
    this.bull.on('active', fn)
  }

  public onProgress (fn) {
    this.bull.on('progress', fn)
  }

  public onFailed (fn) {
    this.bull.on('failed', fn)
  }

  public onCompleted (fn) {
    this.bull.on('completed', fn)
  }

}
