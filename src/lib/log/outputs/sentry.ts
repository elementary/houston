/**
 * houston/src/lib/log/services/sentry.ts
 * Handles logging errors to sentry
 */

import { Config } from '../../config'
import { Log } from '../log'
import { Output } from '../output'

export class Sentry extends Output {

  /**
   * The current application configuration
   *
   * @var {Config}
   */
  protected config: Config

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
   * @return {boolean}
   */
  public static enabled (config: Config): boolean {
    if (config.has('log.sentry') === false) {
      return false
    } else if (config.has('service.sentry.secret') === false) {
      return false
    }

    try {
      require.resolve('raven')
    } catch (e) {
      return false
    }

    return (config.get('log.sentry') !== 'never')
  }

  /**
   * Creates a new Sentry output
   *
   * @param {Config} config
   */
  public constructor (config: Config) {
    super(config)

    this.config = config
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
    this.raven.captureException(this.toError(log))
  }

  /**
   * Transforms a log message to an error
   *
   * @param {Log} log
   *
   * @return {Error}
   */
  public toError (log: Log): Error {
    const error = new Error(log.message)

    // Add a stack trace no including this function
    Error.captureStackTrace(error, this.toError)
    Object.assign(error, log.data, { error: log.error })

    return error
  }

  /**
   * Sets up raven with common metadata and things.
   *
   * @return {Raven}
   */
  protected setup () {
    return require('raven')
      .config(this.dns)
      .install()
  }
}
