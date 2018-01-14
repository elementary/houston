/**
 * houston/src/worker/storable.ts
 * An interface for storing worker data.
 *
 * @exports {Interface} Storable
 */

import { Log } from './log'

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
