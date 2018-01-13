/**
 * houston/src/repo/provider.ts
 * Provides the app with the needed Repo server classes
 */

import { ContainerModule } from 'inversify'

import { Repo } from './repo'

export const provider = new ContainerModule((bind) => {
  bind<Repo>(Repo).toSelf()
})
