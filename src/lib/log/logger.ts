/**
 * houston/src/lib/log/logger.ts
 * A manager of logs and third party logging services.
 */

import { inject, injectable, multiInject } from 'inversify'

import { Config } from '../config'
import { Level, levelString } from './level'
import { Log } from './log'
import { Output, OutputConstructor } from './output'

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
   * Creates a new logger
   *
   * @param {Config} config
   * @param {OutputConstructor[]} outputters
   */
  public constructor (
    @inject(Config) config: Config,
    @multiInject(Output) outputters: OutputConstructor[]
  ) {
    this.config = config

    this.setupOutputs(outputters)
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
      output[levelString(log.level)](log)
    })
  }

  /**
   * Sets up an output for the logger
   *
   * @param {OutputConstructor} outputter
   * @return {Logger}
   */
  protected setupOutput (outputter: OutputConstructor): this {
    if (outputter.enabled(this.config)) {
      // I would log this here if I could.
      this.outputs.push(new outputter(this.config))
    }

    return this
  }

  /**
   * Given an array of outputters, we try to set them up
   *
   * @param {OutputConstructor[]} outputters
   * @return {Logger}
   */
  protected setupOutputs (outputters: OutputConstructor[]): this {
    outputters.forEach((outputter) => {
      this.setupOutput(outputter)
    })

    return this
  }
}
