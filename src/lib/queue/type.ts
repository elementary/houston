/**
 * houston/src/lib/queue/type.ts
 * Some typescript types for a queue system.
 */

import { EventEmitter } from 'events'

export type Status = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'

export type HandleCallback = (job: IJob) => Promise<object>

export type OnActiveCallback = (job: IJob) => void
export type OnProgressCallback = (job: IJob, amount: number) => void
export type OnFailedCallback = (job: IJob, error: Error) => void
export type OnCompletedCallback = (job: IJob, result: object) => void

export type QueueConstructor = (name: string) => IQueue
export const Queue = Symbol.for('IQueue') // tslint:disable-line

export interface IQueue {
  send (data: object, opts?: IJobOptions): Promise<IJob>
  handle (fn: HandleCallback)

  pause (local: boolean): Promise<void>
  resume (local: boolean): Promise<void>

  empty (): Promise<void>
  close (): Promise<void>
  count (state?: Status): Promise<number>
  jobs (state: Status): Promise<IJob[]>

  onActive (fn: OnActiveCallback)
  onProgress (fn: OnProgressCallback)
  onFailed (fn: OnFailedCallback)
  onCompleted (fn: OnCompletedCallback)
}

export interface IJobOptions {
  priority?: number
  delay?: number
  attempts?: number
  timeout?: number
}

export interface IJob {
  status (): Promise<Status>
  progress (amount: number)

  remove (): Promise<void>
}
