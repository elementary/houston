/**
 * houston/src/lib/queue/index.ts
 * Exports all you need to get started with the queue system.
 */

export { IQueue, IQueueConstructor, Status } from './type'

export const Queue = Symbol.for('Queue') // tslint:disable-line
export const workerQueue = Symbol.for('workerQueue') // tslint:disable-line
