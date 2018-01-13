/**
 * houston/src/worker/storable.ts
 * An interface for storing worker data.
 *
 * @exports {Interface} Storable
 */

import { Log } from './log'

export interface Storable {
  nameDeveloper: string
  nameDomain: string
  nameAppstream: string
  nameHuman: string

  version: string

  distribution: string
  architecture: string
  packageSystem: string
  branches: string[]

  appcenter: object
  appstream: object

  logs: Log[]
}
