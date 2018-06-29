/**
 * houston/src/worker/provider.ts
 * Provides the app with the main worker classes
 */

import { ContainerModule } from 'inversify'

import { Worker } from './index'

export const provider = new ContainerModule((bind) => {
  bind<Worker>(Worker).toConstructor(Worker)
})
