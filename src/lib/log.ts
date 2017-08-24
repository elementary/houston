/**
 * houston/src/lib/log.ts
 * A super amazing logger that you should use, because it does know what is
 * best for you.
 *
 * @exports {Class} Log - A super awesome logger class
 */

// This file outputs to console.
// tslint:disable no-console

import { Client as Raven } from 'raven'
import { inspect } from 'util'

import { Config } from './config'

const levels = ['debug', 'info', 'warn', 'error', 'never']

/**
 * Log
 * A super awesome logger class.
 */
export class Log {

  protected config: Config
  protected namespace: string

  protected consoleLevel: string
  protected serviceLevel: string

  protected sentry: Raven|null

  /**
   * Creates a new Log instance.
   *
   * @param {Config} config - The configuration to use
   */
  constructor (config: Config, namespace = 'houston') {
    this.config = config
    this.namespace = namespace

    this.consoleLevel = config.get('log.console', 'info')
    this.serviceLevel = config.get('log.service', 'error')

    this.setupServices()
  }

  /**
   * debug
   * Sends some information to the debug.
   *
   * @param {string} msg - The message to send
   * @param {object} [data] - Optional data to also put in log
   * @return {void}
   */
  public debug (msg: string, data?: object): void {
    if (this.shouldReportToService('debug') === true) {
      this.reportToService(msg, data)
    }

    if (this.shouldReportToConsole('debug') === false) {
      return
    }

    console.log(`DEBUG ${this.namespace} ${msg}`)

    if (data != null) {
      this.reportData(data)
    }
  }

  /**
   * info
   * Sends information to the info log.
   *
   * @param {string} msg - The message to send
   * @param {object} [data] - Optional data to also put in log
   * @return {void}
   */
  public info (msg: string, data?: object): void {
    if (this.shouldReportToService('info') === true) {
      this.reportToService(msg, data)
    }

    if (this.shouldReportToConsole('info') === false) {
      return
    }

    if (console.info != null) {
      console.info(`INFO ${this.namespace} ${msg}`)
    } else {
      console.log(`INFO ${this.namespace} ${msg}`)
    }

    if (data != null) {
      this.reportData(data)
    }
  }

  /**
   * warn
   * Sends information to the warn log.
   *
   * @param {string} msg - The message to send
   * @param {object} [data] - Optional data to also put in log
   * @return {void}
   */
  public warn (msg: string, data?: object): void {
    if (this.shouldReportToService('warn') === true) {
      this.reportToService(msg, data)
    }

    if (this.shouldReportToConsole('warn') === false) {
      return
    }

    if (console.warn) {
      console.warn(`WARN ${this.namespace} ${msg}`)
    } else {
      console.log(`WARN ${this.namespace} ${msg}`)
    }

    if (data != null) {
      this.reportData(data)
    }
  }

  /**
   * error
   * Sends information to the error log.
   *
   * @param {string} msg - The message to send
   * @param {object} [data] - Optional data to also put in log
   * @return {void}
   */
  public error (msg: string, data?: object): void {
    if (this.shouldReportToService('error') === true) {
      this.reportToService(msg, data)
    }

    if (this.shouldReportToConsole('error') === false) {
      return
    }

    if (console.error != null) {
      console.error(`ERROR ${this.namespace} ${msg}`)
    } else if (console.warn) {
      console.warn(`ERROR ${this.namespace} ${msg}`)
    } else {
      console.log(`ERROR ${this.namespace} ${msg}`)
    }

    if (console.trace != null) {
      console.trace()
    }

    if (data != null) {
      this.reportData(data)
    }
  }

  /**
   * reportData
   * Outputs an object to the log.
   *
   * @param {object} data - The data to be outputed to the log
   * @return {void}
   */
  public reportData (data: object) {
    if (typeof data === 'object') {
      if (Object.keys(data).length > 0) {
        const inspected = inspect(data, {
          colors: true,
          depth: 6,
          showHidden: false
        })

        console.log(inspected)
      }

      return
    }

    console.log(JSON.stringify(data, null, '\t'))
  }

  /**
   * reportToService
   * Sends information to a third party service for tracking.
   *
   * @param {string} msg - The message to send
   * @param {object} [data] - Optional data to also put in log
   * @return {void}
   */
  public reportToService (msg: string, data?: object): void {
    if (this.sentry != null) {
      this.sentry.context(() => {
        if (data != null) {
          this.sentry.setContext(data)
        }

        throw new Error(msg)
      })
    }
  }

  /**
   * setupServices
   * Sets up third party services for logger instance.
   *
   * @return {void}
   */
  protected setupServices (): void {
    if (this.config.has('service.sentry') === true) {
      let key = null

      if (this.config.has('service.sentry.secret') === true) {
        key = this.config.get('service.sentry.secret')
      } else if (this.config.has('service.sentry.public') === true) {
        key = this.config.get('service.sentry.public')
      }

      if (key != null) {
        this.sentry = new Raven(key)
        this.sentry.release = this.config.get('houston.version')
        this.sentry.environment = this.config.get('environment')
      } else {
        this.error('No sentry service key configured')
      }
    }
  }

  /**
   * shouldReportToConsole
   * Checks if we should output something to console based on log level.
   *
   * @param {string} level - The log level to check
   * @return {boolean}
   */
  protected shouldReportToConsole (level: string): boolean {
    const levelIndex = levels.indexOf(level)
    const consoleIndex = levels.indexOf(this.consoleLevel)

    if (consoleIndex > levelIndex) {
      return false
    }

    return true
  }

  /**
   * shouldReportToService
   * Checks if we should output something to console based on log level.
   *
   * @param {string} level - The log level to check
   * @return {boolean}
   */
  protected shouldReportToService (level: string): boolean {
    const levelIndex = levels.indexOf(level)
    const serviceIndex = levels.indexOf(this.serviceLevel)

    if (serviceIndex > levelIndex) {
      return false
    }

    // We never report errors unless we are actually in a production environment
    if (this.config.get('environment', 'production') !== 'production') {
      return false
    }

    return true
  }
}
