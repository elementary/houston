/**
 * houston/src/lib/log/outputs/console.e2e.ts
 * Tests console out logging. End to End testing due to mocks of the console
 */

import * as sinon from 'sinon'

import { create } from '../../../../test/utility/app'

import { App } from '../../app'
import { Config } from '../../config'
import { Level } from '../level'
import { Log } from '../log'
import { Logger } from '../logger'
import { Console } from './console'

let app: App
let config: Config
let logger: Logger
let output: Console

// Simon stubs for the console
let info
let warn
let error

beforeEach(async () => {
  app = await create()

  config = app.get<Config>(Config)
  config.set('log.console', 'debug')

  logger = new Logger(config)
  output = new Console(config)

  info = sinon.stub(console, 'info')
  warn = sinon.stub(console, 'warn')
  error = sinon.stub(console, 'error')
})

afterEach(() => {
  info.restore()
  warn.restore()
  error.restore()
})

test('debug gets outputted to console debug', () => {
  const log = new Log(logger)
    .setLevel(Level.DEBUG)

  output.debug(log)

  expect(info.called).toBeTruthy()
})

test('info gets outputted to console info', () => {
  const log = new Log(logger)
    .setLevel(Level.INFO)

  output.info(log)

  expect(info.called).toBeTruthy()
})

test('warn gets outputted to console warn', () => {
  const log = new Log(logger)
    .setLevel(Level.WARN)

  output.warn(log)

  expect(warn.called).toBeTruthy()
})

test('error gets outputted to console error', () => {
  const log = new Log(logger)
    .setLevel(Level.ERROR)

  output.error(log)

  expect(error.called).toBeTruthy()
})
