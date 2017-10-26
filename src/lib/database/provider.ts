/**
 * houston/src/lib/log/provider.ts
 * Provides the app with the needed Log classes
 */

import { ContainerModule } from 'inversify'

import { Database } from './database'

export const provider = new ContainerModule((bind) => {
  bind<Database>(Database).toSelf()
})
