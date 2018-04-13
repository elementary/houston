/**
 * houston/src/worker/log.ts
 * A log to be passed around during a worker role
 */

import * as fs from 'fs-extra'

import { Level } from '../lib/log/level'
import render from '../lib/utility/template'
import { ILog } from './type'

export class Log extends Error implements ILog {
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
   * A wrapped native error
   *
   * @var {Error|null}
   */
  public error?: Error

  /**
   * Creates a new log from a file. This will take the first non-whitespace line
   * as the title, and the rest as the Log body
   *
   * @param {Level} level
   * @param {string} path
   * @param {object} [data]
   * @return {Log}
   */
  public static template (level: Level, path: string, data = {}): Log {
    const template = fs.readFileSync(path, 'utf8')
    const raw = render(template, data)

    let title = raw.trim().split('\n')[0].trim()
    // Most issues start with an h1 markdown header. It's easier to read and
    // Edit, but it's not supported in most repos as the title is plain text.
    if (title.startsWith('#')) {
      title = title.substring(2)
    }

    const body = raw.trim().split('\n').slice(1).join('\n').trim()

    return new Log(level, title, body)
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
   * Wraps an error in the current Log
   *
   * @param {Error} error
   * @return {Log}
   */
  public setError (error: Error): Log {
    this.message = error.message
    this.error = error

    return this
  }

  /**
   * Returns a nice string version of the log
   * BUG: This should override the default node `Error.toString()`
   *
   * @return {string}
   */
  public toString () {
    const out = []

    if (this.body != null) {
      const bodyIndented = this.body
        .split('\n')
        .map((l) => `  ${l}`)

      out.push(...bodyIndented)
    } else {
      const stackIndented = this.stack
        .split('\n')
        .map((l) => `  ${l}`)

      out.push(...stackIndented)
    }

    return out.join('\n')
  }
}
