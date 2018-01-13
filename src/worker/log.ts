/**
 * houston/src/worker/log.ts
 * A log to be passed around during a worker role
 */

import { Level } from '../lib/log/level'
import { Task } from './task/task'

export class Log extends Error {
  /**
   * A handy level assignment for easier usage
   *
   * @var {Level}
   */
  public static Level = Level

  /**
   * The log title
   *
   * @var {string}
   */
  public title: string

  /**
   * The log body
   *
   * @var {string|null}
   */
  public body?: string

  /**
   * The severity of the log
   *
   * @var {LogLevel}
   */
  public level: Level

  /**
   * The workable item this error occured on
   *
   * @var {Workable|null}
   */
  public work?: Workable

  /**
   * A wrapped native error
   *
   * @var {Error|null}
   */
  public error?: Error

  /**
   * Creates a new log from a file
   *
   * @param {Level} level
   * @param {string} path
   * @param {object} [data]
   * @return {Log}
   */
  public static template (level: Level, path: string, data = {}): Log {
    const instance = new Log(level, 'test', 'test')

    return instance
  }

  /**
   * Creates a new Log
   *
   * @param {Level} level
   * @param {string} title
   * @param {string} [body]
   */
  constructor (level: Level, title: string, body?: string) {
    super(title)

    this.level = level
    this.title = title
    this.body = body
  }

  /**
   * Sets the workable item for the log
   *
   * @param {Workable} work
   * @return {Log}
   */
  public workable (work: Workable): Log {
    this.work = work

    return this
  }

  /**
   * Wraps an error in the current Log
   *
   * @param {Error} error
   * @return {Log}
   */
  public wrap (error: Error): Log {
    this.message = error.message
    this.error = error

    return this
  }
}
