/**
 * houston/src/lib/log/level.ts
 * Some log levels
 */

/**
 * The debug level of logs
 *
 * @var {Symbol}
 */
export const DEBUG = Symbol()

/**
 * The info level of logs
 *
 * @var {Symbol}
 */
export const INFO = Symbol()

/**
 * The warn level of logs
 *
 * @var {Symbol}
 */
export const WARN = Symbol()

/**
 * The error level of logs
 *
 * @var {Symbol}
 */
export const ERROR = Symbol()

/**
 * An enum representing all of the log levels
 *
 * @var {enum}
 */
export enum Level { DEBUG, INFO, WARN, ERROR }

/**
 * Parses a string value for a level symbol
 *
 * @param {string} level
 * @return {Level}
 */
export function parseLevel (level: string): Level {
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
 * Returns a string given a level symbol
 *
 * @param {Level} level
 * @return {string}
 */
export function levelString (level: Level): string {
  switch (level) {
    case (Level.DEBUG):
      return 'debug'
    case (Level.INFO):
      return 'info'
    case (Level.WARN):
      return 'warn'
    case (Level.ERROR):
      return 'error'
    default:
      return 'info'
  }
}

/**
 * Returns a number index of severity for a level symbol
 *
 * @param {Level} level
 * @return {Number}
 */
export function levelIndex (level: Level): number {
  switch (level) {
    case (Level.DEBUG):
      return 0
    case (Level.INFO):
      return 1
    case (Level.WARN):
      return 2
    case (Level.ERROR):
      return 3
    default:
      return 1
  }
}
