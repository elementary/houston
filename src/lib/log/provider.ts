/**
 * houston/src/lib/log/provider.ts
 * Provides the app with the needed Log classes
 */

import { ContainerModule } from 'inversify'

import { Log } from './log'
import { Logger } from './logger'
import { Output } from './output'
import { Console } from './outputs/console'
import { Sentry } from './outputs/sentry'

export const provider = new ContainerModule((bind) => {
  bind<Output>(Output).toConstructor(Console)
  bind<Output>(Output).toConstructor(Sentry)

  bind<Log>(Log).toConstructor(Log)

  bind<Logger>(Logger).toSelf()
})
