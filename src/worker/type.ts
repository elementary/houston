/**
 * houston/src/worker/type.ts
 * A bunch of type definitions for the worker process
 */

import { Config } from '../lib/config'
import { Level } from '../lib/log/level'
import { ICodeRepository, IServiceIds } from '../lib/service'
import { EventEmitter } from '../lib/utility/eventemitter'

export type Type = 'app' | 'system-app' | 'library' | 'system-library' | 'debug'
export type PackageSystem = 'deb'

export interface IPackage extends IServiceIds {
  type: PackageSystem
  path?: string // Full path on the FS

  architecture?: string
  distribution?: string
}

export interface IResult {
  failed: boolean

  packages: IPackage[]

  appcenter?: object
  appstream?: string

  logs: ILog[]
}

export interface ILog extends Error, IServiceIds {
  level: Level
  title: string
  body?: string
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
  nameAppstream: string
  nameHuman: string

  version: string

  architecture: string
  distribution: string

  references: string[]
  changelog: IChange[]

  package?: IPackage

  appcenter?: object
  appstream?: string // An XML formatted string

  stripe?: string

  logs: ILog[]
}

export interface ITaskConstructor {
  new (worker: IWorker): ITask
}

export interface ITask {
  run (): Promise<void>
}

export interface IWorker extends EventEmitter {
  config: Config
  context: IContext
  repository: ICodeRepository
  workspace: string

  report (err: Error)
  stop ()
}
