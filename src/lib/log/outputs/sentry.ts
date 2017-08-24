/**
 * houston/src/lib/log/services/sentry.ts
 * Handles logging errors to sentry
 */

import { injectable } from 'inversify'

import { Config } from '../../config'
import { Log } from '../log'
import { Output } from '../output'

@injectable()
export class Sentry implements Output {

  /**
   * The sentry dns to use when reporting logs
   *
   * @var {String}
   */
  protected dns: string

  /**
   * A raven instance for logging to sentry
   *
   * @var {Raven}
   */
  protected raven

  /**
   * Checks if this output should be enabled
   *
   * @param {Config} config
   *
   * @return {boolean}
   */
  public static enabled (config: Config): boolean {
    if (config.has('service.sentry.secret') === false) {
      return false
    }

    try {
      const _ = require('raven')
    } catch (e) {
      return false
    }

    return true
  }

  /**
   * Creates a new Sentry output
   *
   * @param {Config} config
   */
  public construct (config: Config) {
    this.dns = config.get('service.sentry.secret')

    this.raven = this.setup()
  }

  /**
   * Sends error logs to sentry
   *
   * @param {Log} log
   * @return {void}
   */
  public error (log: Log) {
    console.log(log.message)
  }

  /**
   * Sets up raven with common metadata and things.
   *
   * @return {Raven}
   */
  protected setup () {
    const instance = require('ravent')
      .config(this.dns)
      .install()
  }
}
