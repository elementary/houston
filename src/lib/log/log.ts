/**
 * houston/src/lib/log/log.ts
 * A log message with super powers.
 *
 * @exports {Class} Log - A single log line.
 */

import { injectable } from 'inversify'

import { Level } from './level'
import { Logger } from './logger'

/**
 * Log
 * A single log line.
 */
@injectable()
export class Log {

  /**
   * The level of the log
   *
   * @var {Level}
   */
  public level: Level

  /**
   * The log message
   *
   * @var {String|Null}
   */
  public message?: string

  /**
   * Attached data to the log
   *
   * @var {Object}
   */
  public data: object

  /**
   * An error attached to the log
   *
   * @var {Error}
   */
  public error?: Error

  /**
   * The date the log was created
   *
   * @var {Date}
   */
  protected date: Date

  /**
   * The current logger to use for sending the log.
   *
   * @var {Logger}
   */
  protected logger: Logger

  /**
   * Creates a new log with default values
   *
   * @param {Logger} logger
   */
  public constructor (logger: Logger) {
    this.level = Level.DEBUG
    this.data = {}
    this.date = new Date()

    this.logger = logger
  }

  /**
   * Sets the log level
   *
   * @param {Level} level
   *
   * @return {Log}
   */
  public setLevel (level: Level): this {
    this.level = level

    return this
  }

  /**
   * Sets the log message
   *
   * @param {String} message
   *
   * @return {Log}
   */
  public setMessage (message: string): this {
    this.message = message

    return this
  }

  /**
   * Sets data in the log
   *
   * @param {String} key
   * @param {*} value
   *
   * @return {Log}
   */
  public setData (key: string, value): this {
    this.data[key] = value

    return this
  }

  /**
   * A shorthand for attaching an error message to a log
   *
   * @param {Error} err
   *
   * @return {Log}
   */
  public setError (err: Error): this {
    this.error = err

    return this
  }

  /**
   * Gets the date this log was created.
   *
   * @return {Date}
   */
  public getDate (): Date {
    return this.date
  }

  /**
   * Sends the log to what ever services / places it needs to be.
   *
   * @return {void}
   */
  public send () {
    return this.logger.send(this)
  }
}
