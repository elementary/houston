/**
 * houston/src/lib/config/loader.spec.ts
 * Tests configuration loading functions.
 */

import * as path from 'path'

import * as loader from './loader'

test('can convert houston environment variables to dot notation', () => {
  expect(loader.environmentToDot('HOUSTON_ENV')).toEqual('env')
  expect(loader.environmentToDot('HOUSTON_SERVER_PORT')).toEqual('server.port')
})

test('can find houston environment variables', () => {
  process.env['HOUSTON_ENV'] = 'development'
  process.env['HOUSTON_SERVER_PORT'] = 3000

  const config = loader.findEnvironmentConfig()

  expect(config.get('env')).toEqual('development')
  expect(config.get('server.port')).toEqual(3000)
})

test('finds node specific variables', () => {
  process.env['NODE_ENV'] = 'development'

  const config = loader.findEnvironmentConfig()

  expect(config.get('env')).toEqual('development')
})

test('can find the package version', () => {
  const config = loader.findProgramConfig()

  expect(config.get('houston.version')).toEqual(expect.anything())
  expect(config.get('houston.major')).toEqual(expect.anything())
  expect(config.get('houston.minor')).toEqual(expect.anything())
  expect(config.get('houston.patch')).toEqual(expect.anything())
})

test('can find the git commit', () => {
  const config = loader.findProgramConfig()

  expect(config.get('houston.commit')).toEqual(expect.anything())
})

test('can find the git change', () => {
  const config = loader.findProgramConfig()

  expect(config.get('houston.change')).toEqual(expect.anything())
})

test('can read configuration from file', () => {
  const testingConfigPath = path.resolve(__dirname, '..', '..', '..', 'test', 'fixture', 'config.js')
  const config = loader.findFileConfig(testingConfigPath)

  expect(config.get('environment')).toEqual('testing')
})
