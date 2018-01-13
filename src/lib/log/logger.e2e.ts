/**
 * houston/src/lib/log/logger.e2e.ts
 * Tests logger usage
 */

import { create } from '../../../test/utility/app'

import { App } from '../../lib/app'
import { Config } from '../../lib/config'
import { Logger } from './logger'

let app: App
let config: Config
let logger: Logger

beforeEach(async () => {
  app = await create()

  config = app.get<Config>(Config)

  config.unfreeze()
  config.set('log.console', 'debug')
  config.freeze()

  logger = new Logger(config)
})

test('console output gets loaded on logger creation', () => {
  expect(logger.outputs).toHaveLength(1)
})
