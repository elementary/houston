/**
 * houston/src/lib/log/outputs/console.spec.ts
 * Tests console out logging.
 */

import { create } from '../../../../test/utility/app'

import { App } from '../../app'
import { Config } from '../../config'
import { Level } from '../level'
import { Console } from './console'

let app: App
let config: Config

beforeEach(async () => {
  app = await create()
  config = app.get<Config>(Config)

  // Unfreeze configuration for testing values
  config.unfreeze()
})

test('outputs info messages when unknown config value', () => {
  config.set('log.console', 'foobar')

  const out = new Console(config)

  expect(out.allows(Level.DEBUG)).toBeFalsy()
  expect(out.allows(Level.INFO)).toBeTruthy()
  expect(out.allows(Level.WARN)).toBeTruthy()
  expect(out.allows(Level.ERROR)).toBeTruthy()
})

test('any lower value level does not get outputted', () => {
  config.set('log.console', 'warn')

  const out = new Console(config)

  expect(out.allows(Level.DEBUG)).toBeFalsy()
  expect(out.allows(Level.INFO)).toBeFalsy()
  expect(out.allows(Level.WARN)).toBeTruthy()
  expect(out.allows(Level.ERROR)).toBeTruthy()
})
