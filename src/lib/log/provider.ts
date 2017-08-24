/**
 * houston/src/lib/log/provider.ts
 * Provides the app with the needed Log classes
 */

import { ContainerModule } from 'inversify'

import { Log } from './log'
import { Logger } from './logger'
import { Output, output } from './output'
import { Sentry } from './outputs/sentry'

export const provider = new ContainerModule((bind) => {
  bind<Log>(Log).toSelf()
  bind<Logger>(Logger).toSelf()

  bind<Output>(output).to(Sentry)
})
