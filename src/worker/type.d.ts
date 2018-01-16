/**
 * houston/src/worker/type.d.ts
 * A bunch of type definitions for the worker process
 */

import { Log } from './log'
import { Worker } from './worker'

type architecture = 'amd64'
type distribution = 'loki' | 'juno'
type packageSystem = 'deb'

export interface Change {
  version: string
  author: string
  changes: string
  date: Date
}

export interface Storable {
  nameDeveloper: string
  nameDomain: string
  nameAppstream: string
  nameHuman: string

  version: string

  references: string[]
  changelog: Change[]

  distribution: distribution
  architecture: architecture
  packageSystem: packageSystem

  appcenter: object
  appstream: object

  logs: Log[]
}

export interface WorkableConstructor {
  new (worker: Worker): Workable
}

export interface Workable {
  run (): Promise<void>
}
