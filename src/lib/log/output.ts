/**
 * houston/src/lib/log/output.ts
 * An abstract class for sending logs somewhere.
 */

 // Disabled because of abstract and interfaces are made to be extended.
 // tslint:disable:no-unused-variable

import { injectable } from 'inversify'

import { Config } from '../config'
import { Log } from './log'

/**
 * A generic abstract class for handling logs.
 */
@injectable()
export abstract class Output {
  /**
   * Checks if we should enable this output
   *
   * @param {Config} config
   *
   * @return {boolean}
   */
  public static enabled (config: Config): boolean {
    return true
  }

  /**
   * Creates a new logger output
   *
   * @param {Config} config
   */
  public constructor (config: Config) {
    return
  }

  /**
   * Does something with a debug log.
   *
   * @param {Log} log
   * @return {void}
   */
  public debug (log: Log) {
    return
  }

  /**
   * Does something with a info log.
   *
   * @param {Log} log
   * @return {void}
   */
  public info (log: Log) {
    return
  }

  /**
   * Does something with a warn log.
   *
   * @param {Log} log
   * @return {void}
   */
  public warn (log: Log) {
    return
  }

  /**
   * Does something with a error log.
   *
   * @param {Log} log
   * @return {void}
   */
  public error (log: Log) {
    return
  }
}

/**
 * An interface of the Output class as a constructor.
 * This is kinda pointless, but it keeps typescript happy when hinting.
 */
export interface OutputConstructor {
  new (config: Config)
  enabled (config: Config): boolean
}
