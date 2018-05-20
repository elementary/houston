/**
 * houston/src/lib/service/provider.ts
 * Registers all the fun third party services that require the IoC container
 */

import { ContainerModule, interfaces } from 'inversify'

import {
  codeRepository,
  logRepository,
  packageRepository
} from './index'

import { Aptly } from './aptly'
import { GitHub } from './github'

export const provider = new ContainerModule((bind) => {
  bind<Aptly>(Aptly).toSelf()
  bind<GitHub>(GitHub).toSelf()

  bind<GitHub>(logRepository).to(GitHub)

  bind<Aptly>(packageRepository).to(Aptly)
  bind<GitHub>(packageRepository).to(GitHub)
})
