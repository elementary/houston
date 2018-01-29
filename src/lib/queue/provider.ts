/**
 * houston/src/lib/queue/provider.ts
 * Sets up the needed providers for the Queue system
 */

import { ContainerModule } from 'inversify'

import { Queue } from './providers/redis'
import * as type from './type'

// TODO: Add more providers.
export const provider = new ContainerModule((bind) => {
  bind<type.QueueConstructor>(type.Queue).toConstructor(Queue)
})
