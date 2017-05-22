/**
 * houston/src/lib/config/loader.spec.ts
 * Tests configuration loading functions.
 */

import * as path from 'path'

import * as loader from './loader'

import { isCi } from '../../../test/utility/ci'

test('can convert houston environment variables to dot notation', () => {
  expect(loader.stringToDot('HOUSTON_SERVER_PORT')).toEqual('server.port')
})

test('converts env to environment', () => {
  expect(loader.stringToDot('HOUSTON_ENV')).toEqual('environment')
})

test('can find houston environment variables', () => {
  process.env['HOUSTON_SERVER_PORT'] = 3000

  const config = loader.getEnvironmentConfig()

  expect(config.get('server.port')).toEqual(3000)
})

test('assigns environment based on NODE_ENV', () => {
  process.env['NODE_ENV'] = 'development'

  const config = loader.getEnvironmentConfig()

  expect(config.get('environment')).toEqual('development')
})

test('assigns console log based on NODE_DEBUG', () => {
  process.env['NODE_DEBUG'] = 'true'

  const config = loader.getEnvironmentConfig()

  expect(config.get('log.console')).toEqual('debug')
})

test('can find the package version', () => {
  const config = loader.getProgramConfig()

  expect(config.get('houston.version')).toEqual(expect.anything())
  expect(config.get('houston.major')).toEqual(expect.anything())
  expect(config.get('houston.minor')).toEqual(expect.anything())
  expect(config.get('houston.patch')).toEqual(expect.anything())
})

if (isCi() === false) { // CI environments usually don't have the git folder.
  test('can find the git commit', () => {
    const config = loader.getProgramConfig()

    expect(config.get('houston.commit')).toEqual(expect.anything())
  })

  test('can find the git change', () => {
    const config = loader.getProgramConfig()

    expect(config.get('houston.change')).toEqual(expect.anything())
  })
}

test('can read configuration from file', () => {
  const testingConfigPath = path.resolve(__dirname, '..', '..', '..', 'test', 'fixture', 'config.js')
  const config = loader.getFileConfig(testingConfigPath)

  expect(config.get('environment')).toEqual('testing')
})

test('can read configuration from relative path', () => {
  const testingConfigPath = path.resolve(__dirname, '..', '..', '..', 'test', 'fixture', 'config.js')
  const relativeConfigPath = path.relative(process.cwd(), testingConfigPath)
  const config = loader.getFileConfig(relativeConfigPath)

  expect(config.get('environment')).toEqual('testing')
})

test('getConfig loads environment variables', () => {
  process.env['HOUSTON_KEY'] = 'value'

  const testingConfigPath = path.resolve(__dirname, '..', '..', '..', 'test', 'fixture', 'config.js')
  const config = loader.getConfig(testingConfigPath)

  expect(config.get('key')).toEqual('value')
})
