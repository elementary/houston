/**
 * houston/src/lib/log/output.ts
 * A generic interface for sending logs somewhere.
 */

import { Config } from '../config'
import { Log } from './log'

/**
 * A generic output interface for handling logs.
 */
export interface Output {
  debug? (log: Log): void
  info? (log: Log): void
  warn? (log: Log): void
  error? (log: Log): void
}

/**
 * A constructor interface for outputs.
 */
export interface OutputConstructor {
  new (config: Config): Output

  enabled (): boolean
}

/**
 * Symbol to use for Output interface binding.
 *
 * @var {Symbol}
 */
export const output = Symbol()

/**
 * Symbol to use for Output constructor interface binding.
 *
 * @var {Symbol}
 */
export const outputConstructor = Symbol()
