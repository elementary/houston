/**
 * houston/src/worker/task/taskInterface.ts
 * An interface for for OOP stuffs
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
