/**
 * A log to be passed around during a worker role
 *
 * @exports {Class} Log
 */

import { Task } from './task/task'

export enum Level {
  ERROR,
  WARN,
  INFO,
  DEBUG
}

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
   * @var {string}
   */
  public body?: string

  /**
   * The severity of the log
   *
   * @var {LogLevel}
   */
  public level: Level

  /**
   * The task the log was from
   *
   * @var {Task|null}
   */
  public task: Task

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

    this.body = body
    this.level = level
  }

  /**
   * Wraps an error in the current Log
   *
   * @param {Error} error
   * @return {Log}
   */
  public wrap (error: Error): Log {
    this.message = error.message

    return this
  }
}
