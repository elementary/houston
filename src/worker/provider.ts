/**
 * houston/src/worker/provider.ts
 * Provides the app with the main worker classes
 */

import { ContainerModule } from 'inversify'

import { Server, Worker } from './index'

export const provider = new ContainerModule((bind) => {
  bind<Server>(Server).toConstructor(Server)
  bind<Worker>(Worker).toConstructor(Worker)
})
