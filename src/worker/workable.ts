/**
 * houston/src/worker/workable.ts
 * An interface for OOP stuffs
 *
 * @exports {Interface} TaskI
 */

import { Worker } from './worker'

export interface WorkableConstructor {
  new (worker: Worker): Workable
}

export interface Workable {
  run (): Promise<void>
}
