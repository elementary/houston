/**
 * houston/src/lib/cache/provider.ts
 * Registers a basic cache factory.
 * TODO: Build this out a bit more with redis support
 */

import { ContainerModule, interfaces } from 'inversify'
import * as Cache from 'lru-cache'

import * as type from './type'

export const provider = new ContainerModule((bind) => {
  // This is not a great idea. I know. It's a quick and dirty fix.
  const instances = {}

  bind<interfaces.Factory<type.ICacheFactory>>(type.Cache)
    .toFactory((context) => (namespace, options = {}) => {
      if (instances[namespace]) {
        return instances[namespace]
      } else {
        instances[namespace] = new Cache({
          maxAge: (options.maxAge || 3600)
        })

        return instances[namespace]
      }
    })
})
