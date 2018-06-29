/**
 * houston/test/e2e/lib/log/outputs/console.ts
 * Tests console out logging. End to End testing due to mocks of the console
 */

import { Macro, test as baseTest, TestInterface } from 'ava'
import { stub } from 'sinon'

import { create } from '../../../../utility/app'

import { App } from '../../../../../src/app'
import { Config } from '../../../../../src/lib/config'
import { Level } from '../../../../../src/lib/log/level'
import { Log } from '../../../../../src/lib/log/log'
import { Logger } from '../../../../../src/lib/log/logger'
import { Console } from '../../../../../src/lib/log/outputs/console'

interface IContext {
  app: App,
  config: Config,
  logger: Logger,
  output: Console,

  info: stub,
  warn: stub,
  error: stub
}

const test = baseTest as TestInterface<IContext>

const testOutput: Macro<IContext> = (t, input: Level, fn: string, expected: string) => {
  const log = new Log(t.context.logger)
    .setLevel(input)

  t.context.output[fn](log)

  t.true(t.context[expected].called)
}

testOutput.title = (_, input: string, fn: string, expected: number) => {
  return `${fn} gets outputted to console ${expected}`
}

test.beforeEach('setup application', async (t) => {
  t.context.app = await create()
  t.context.config = t.context.app.get<Config>(Config)

  t.context.config.unfreeze()
  t.context.config.set('log.console', 'debug')
  t.context.config.freeze()

  t.context.logger = new Logger(t.context.config)
  t.context.output = new Console(t.context.config)
})

test.beforeEach('setup console stubs', (t) => {
  t.context.info = stub(console, 'info')
  t.context.warn = stub(console, 'warn')
  t.context.error = stub(console, 'error')
})

test.afterEach.always((t) => {
  t.context.info.restore()
  t.context.warn.restore()
  t.context.error.restore()
})

test.serial(testOutput, Level.DEBUG, 'debug', 'info')
test.serial(testOutput, Level.INFO, 'info', 'info')
test.serial(testOutput, Level.WARN, 'warn', 'warn')
test.serial(testOutput, Level.ERROR, 'error', 'error')
