/**
 * houston/src/lib/server/provider.ts
 * Provides the app with the needed Server classes
 */

import { ContainerModule } from 'inversify'

import { Server } from './server'

export const provider = new ContainerModule((bind) => {
  bind<Server>(Server).toSelf()
})
