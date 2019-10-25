/**
 * houston/src/worker/type.ts
 * A bunch of type definitions for the worker process
 */

import { App } from '../lib/app'
import { Level } from '../lib/log/level'
import * as service from '../lib/service'
import { EventEmitter } from '../lib/utility/eventemitter'

export type Type = 'app' | 'system-app' | 'library' | 'system-library' | 'debug'

export { IPackage } from '../lib/service'

export interface IResult {
  failed: boolean

  packages: service.IPackage[]

  appcenter?: object
  appstream?: string

  logs: ILog[]
}

export interface ILog extends service.ILog {
  level: Level
}

export interface IChange {
  version: string
  author: string
  changes: string
  date: Date
}

export interface IContext {
  type: Type

  nameDeveloper: string
  nameDomain: string
  nameHuman: string

  version: string

  architecture: string
  distribution: string

  references: string[]
  changelog: IChange[]

  package?: service.IPackage

  appcenter?: object
  appstream?: string // An XML formatted string

  stripe?: string

  logs: ILog[]
}

export type ITaskConstructor = new (worker: IWorker) => ITask

export interface ITask {
  run (): Promise<void>
}

export interface IWorker extends EventEmitter {
  app: App
  context: IContext
  fails: boolean
  passes: boolean
  postTasks: ITaskConstructor[]
  repository: service.ICodeRepository
  result: IResult
  tasks: ITaskConstructor[]
  workspace: string

  setup ()
  run ()
  teardown ()
  stop ()

  report (err: Error)
}
