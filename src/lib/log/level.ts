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
 * @param {String} level
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
 * Does the opposite of the above function.
 *
 * @param {Level} level
 * @return {Level}
 */
export function levelString (level: Level): string {
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
