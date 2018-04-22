/**
 * houston/src/lib/queue/provider.ts
 * Sets up the needed providers for the Queue system
 */

import { ContainerModule, interfaces } from 'inversify'

import { Config } from '../config'
import { Queue, workerQueue } from './index'
import { Queue as RedisQueue } from './providers/redis'
import { IQueue, IQueueConstructor } from './type'

export const provider = new ContainerModule((bind) => {
  bind<IQueueConstructor>(Queue).toFactory<IQueue>((context: interfaces.Context) => {
    return function QueueFactory (name: string) {
      const config = context.container.get<Config>(Config)

      if (config.get('queue.client') === 'redis') {
        try {
          require.resolve('bull')
        } catch (e) {
          throw new Error('Package "bull" is not installed. Please install it.')
        }

        return new RedisQueue(config, name)
      }

      if (config.has('queue.client') === false) {
        throw new Error('No queue client configured')
      } else {
        throw new Error(`Unknown queue client of "${config.get('queue.client')}" configured`)
      }
    }
  })

  bind<IQueue>(workerQueue).toDynamicValue((context: interfaces.Context) => {
    const queueConstructor = context.container.get<IQueueConstructor>(Queue)

    return queueConstructor('WorkerQueue')
  })
})
