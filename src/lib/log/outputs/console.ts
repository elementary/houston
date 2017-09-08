/**
 * houston/src/lib/log/services/console.ts
 * Outputs logs to the console
 */

// Disabled because this file is all about console logs
// tslint:disable:no-console

import { inject, injectable } from 'inversify'

import { Config } from '../../config'
import { Level, parseLevel } from '../level'
import { Log } from '../log'
import { Output } from '../output'

@injectable()
export class Console extends Output {

  /**
   * Configuration to use for console logs.
   *
   * @var {Config}
   */
  protected config: Config

  /**
   * Checks if this output should be enabled
   *
   * @param {Config} config
   *
   * @return {boolean}
   */
  public static enabled (config: Config): boolean {
    if (config.has('log.console') === false) {
      return false
    }

    return true
  }

  /**
   * Creates a new Sentry output
   *
   * @param {Config} config
   */
  public constructor (@inject(Config) config: Config) {
    super(config)

    this.config = config
  }

  /**
   * Sends debug info to the console
   *
   * @param {Log} log
   * @return {void}
   */
  public debug (log: Log) {
    console.info(log.message)
  }

  /**
   * Logs a message to the console
   *
   * @param {Log} log
   * @return {void}
   */
  public info (log: Log) {
    console.info(log.message)
  }

  /**
   * Logs a warning log to the console
   *
   * @param {Log} log
   * @return {void}
   */
  public warn (log: Log) {
    console.warn(log.message)
  }

  /**
   * Logs an error to the console
   *
   * @param {Log} log
   * @return {void}
   */
  public error (log: Log) {
    console.error(log.message)
  }

  /**
   * Checks if the configuration allows a given log level.
   *
   * @param {Level} level
   *
   * @return {Boolean}
   */
  public allows (level: Level) {
    if (this.config.has('log.console') === false) {
      return false
    }

    const configLevel = parseLevel(this.config.get('log.console'))

    if (level >= configLevel) {
      return true
    }

    return false
  }
}
