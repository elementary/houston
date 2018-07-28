/**
 * houston/src/lib/service/provider.ts
 * Registers all the fun third party services that require the IoC container
 */

import { ContainerModule, interfaces } from 'inversify'

import {
  codeRepository,
  codeRepositoryFactory,
  logRepository,
  packageRepository
} from './index'

import { Aptly } from './aptly'
import { GitHub, github, IGitHubFactory } from './github'
import * as type from './type'

export const provider = new ContainerModule((bind) => {
  bind<interfaces.Factory<GitHub>>(github)
    .toFactory((context) => (url) => {
      const instance = context.container.resolve(GitHub)
      instance.url = url

      return instance
    })

  bind(codeRepositoryFactory).toProvider((context) => (url) => {
    return new Promise<type.ICodeRepository>((resolve) => {
      return resolve(context.container.get<IGitHubFactory>(github)(url))
    })
  })

  bind<Aptly>(Aptly).toSelf()

  bind<Aptly>(packageRepository).to(Aptly)
})
