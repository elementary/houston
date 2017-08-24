/**
 * houston/src/lib/log/logger.ts
 * A manager of logs and third party logging services.
 */

import { injectable, multiInject } from 'inversify'

import { Config } from '../config'
import { Level } from './level'
import { Log } from './log'
import { Output, OutputConstructor, outputConstructor } from './output'

/**
 * Log
 * A manager of logs and third party logging services
 */
@injectable()
export class Logger {

  /**
   * The configuration to use
   *
   * @var {Config}
   */
  protected config: Config

  /**
   * A list of outputs we should use for logs
   *
   * @var {Output[]}
   */
  protected outputs: Output[] = []

  /**
   * Parses a string value for a level symbol
   *
   * @param {String} level
   * @return {Level}
   */
  protected static parseLevel (level: string): Level {
    switch (level.toLowerCase().trim()) {
      case ('debug'):
        return Level.DEBUG
      case ('info'):
        return Level.INFO
      case ('warn'):
        return Level.WARN
      case ('error'):
        return Level.ERROR
      default:
        return Level.INFO
    }
  }

  /**
   * Does the opposite of the above function.
   *
   * @param {Level} level
   * @return {Level}
   */
  protected static levelString (level: Level): string {
    if (level === Level.DEBUG) {
      return 'debug'
    }

    if (level === Level.INFO) {
      return 'info'
    }

    if (level === Level.WARN) {
      return 'warn'
    }

    if (level === Level.ERROR) {
      return 'error'
    }

    return 'info'
  }

  /**
   * Creates a new logger
   *
   * @param {Config} config
   */
  public construct (
    config: Config,
    @multiInject(outputConstructor) outputers: OutputConstructor[]
  ) {
    this.config = config

    this.setupOutputs(outputers)
  }

  /**
   * Creates a new log
   *
   * @return {Log}
   */
  public create (): Log {
    return new Log(this)
  }

  /**
   * Creates a new debug log
   *
   * @param {String} message
   * @return {Log}
   */
  public debug (message: string): Log {
    return this.create()
      .setLevel(Level.DEBUG)
      .setMessage(message)
  }

  /**
   * Creates a new info log
   *
   * @param {String} message
   * @return {Log}
   */
  public info (message: string): Log {
    return this.create()
      .setLevel(Level.INFO)
      .setMessage(message)
  }

  /**
   * Creates a new warn log
   *
   * @param {String} message
   * @return {Log}
   */
  public warn (message: string): Log {
    return this.create()
      .setLevel(Level.WARN)
      .setMessage(message)
  }

  /**
   * Creates a new error log
   *
   * @param {String} message
   * @return {Log}
   */
  public error (message: string): Log {
    return this.create()
      .setLevel(Level.ERROR)
      .setMessage(message)
  }

  /**
   * Does things with a finished log.
   *
   * @param {Log} log
   */
  public send (log: Log) {
    this.outputs.forEach((output) => {
      const fn = output[Logger.levelString(log.level)]

      if (fn != null) {
        fn(log)
      }
    })
  }

  /**
   * Sets up an output for the logger
   *
   * @param {OutputConstructor} outputer
   * @return {Logger}
   */
  protected setupOutput (outputer: OutputConstructor): this {
    if (outputer.enabled()) {
      // I would log this here if I could.
      this.outputs.push(new outputer(this.config))
    }

    return this
  }

  /**
   * Given an array of outputters, we try to set them up
   *
   * @param {OutputConstructor[]} outputers
   * @return {Logger}
   */
  protected setupOutputs (outputers: OutputConstructor[]): this {
    outputers.forEach((outputer) => {
      this.setupOutput(outputer)
    })

    return this
  }
}
