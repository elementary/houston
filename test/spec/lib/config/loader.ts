/**
 * houston/test/spec/lib/config/loader.ts
 * Tests configuration loading functions.
 */

import baseTest, { TestInterface } from 'ava'
import * as path from 'path'

import * as loader from '../../../../src/lib/config/loader'

import { isCi } from '../../../utility/ci'

const test = baseTest as TestInterface<{
  testingConfigPath: string
}>

test.beforeEach((t) => {
  t.context.testingConfigPath = path.resolve(__dirname, '..', '..', '..', 'fixture', 'config.js')
})

test('can convert houston environment variables to dot notation', (t) => {
  t.is(loader.stringToDot('HOUSTON_SERVER_PORT'), 'server.port')
})

test('converts env to environment', (t) => {
  t.is(loader.stringToDot('HOUSTON_ENV'), 'environment')
})

test('can find houston environment variables', (t) => {
  process.env.HOUSTON_SERVER_PORT = '3000'

  const config = loader.getEnvironmentConfig()

  t.is(config.get('server.port'), 3000)
})

test('assigns environment based on NODE_ENV', (t) => {
  process.env.NODE_ENV = 'development'

  const config = loader.getEnvironmentConfig()

  t.is(config.get('environment'), 'development')
})

test('assigns console log based on NODE_DEBUG', (t) => {
  process.env.NODE_DEBUG = 'true'

  const config = loader.getEnvironmentConfig()

  t.is(config.get('log.console'), 'debug')
})

test('can find the package version', (t) => {
  const config = loader.getProgramConfig()

  t.true(config.has('houston.version'))
  t.true(config.has('houston.major'))
  t.true(config.has('houston.minor'))
  t.true(config.has('houston.patch'))
})

// CI environments usually don't have the git folder.
if (isCi() === false) {
  test('can find the git commit', (t) => {
    const config = loader.getProgramConfig()

    t.true(config.has('houston.commit'))
  })

  test('can find the git change', (t) => {
    const config = loader.getProgramConfig()

    t.true(config.has('houston.change'))
  })
}

test('can read configuration from file', (t) => {
  const { testingConfigPath } = t.context
  const config = loader.getFileConfig(testingConfigPath)

  t.is(config.get('environment'), 'testing')
})

test('can read configuration from relative path', (t) => {
  const { testingConfigPath } = t.context
  const relativeConfigPath = path.relative(process.cwd(), testingConfigPath)
  const config = loader.getFileConfig(relativeConfigPath)

  t.is(config.get('environment'), 'testing')
})

test('getConfig loads environment variables', (t) => {
  process.env.HOUSTON_KEY = 'value'

  const { testingConfigPath } = t.context
  const config = loader.getConfig(testingConfigPath)

  t.is(config.get('key'), 'value')
})
