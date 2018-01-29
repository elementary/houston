/**
 * houston/src/lib/utility/faker/provider.ts
 * Provides the app with the needed Log classes
 */

import { ContainerModule } from 'inversify'

import { Faker } from './index'

export const provider = new ContainerModule((bind) => {
  bind<Faker>(Faker).toSelf()
})
