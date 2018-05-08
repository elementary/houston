/**
 * houston/src/lib/service/provider.ts
 * Registers all the fun third party services that require the IoC container
 */

import { ContainerModule, interfaces } from 'inversify'

import { Aptly } from './aptly'

export const provider = new ContainerModule((bind) => {
  bind<Aptly>(Aptly).toSelf()
})
