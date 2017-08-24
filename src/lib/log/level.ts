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
