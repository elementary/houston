/**
 * test/lib/config.js
 * Tests the ability of Config class to
 */

import fs from 'fs'
import path from 'path'
import test from 'ava'

import alias from 'root/.alias'
import Config from 'lib/config/class'
import pkg from 'root/package.json'

test.beforeEach((t) => {
  t.context.config = new Config()
  t.context.config.current['env'] = 'production'
  t.context.config.current['server'] = {url: 'https://developer.elementary.io'}
  t.context.config.current['rights'] = false
})

test('has accuratly checks if a key exists', (t) => {
  const config = t.context.config

  t.true(config.has('env'))
  t.true(config.has('server.url'))
  t.true(config.has('rights'))
  t.false(config.has('nonexistant'))
})

test('get accuratly returns a value', (t) => {
  const config = t.context.config

  t.is(config.get('env'), 'production')
  t.is(config.get('server.url'), 'https://developer.elementary.io')
  t.is(config.get('nonexistant'), undefined)
})

test('set accuratly sets a configuration value', (t) => {
  const config = t.context.config

  t.true(config.set('testing', 'current'))
  t.true(config.set('moretest.nested.value', 'testing'))

  t.is(config.get('testing'), 'current')
  t.is(config.get('moretest.nested.value'), 'testing')
})

test('default only sets value if it does not exist', (t) => {
  const config = t.context.config

  t.true(config.default('added.thing', 'testing'))
  t.false(config.default('env', 'testing'))

  t.is(config.get('added.thing'), 'testing')
  t.not(config.get('env'), 'testing')
})

test('loadedGenerated sets default environment to production', (t) => {
  const config = new Config()
  config.loadGenerated()

  t.is(config.get('env'), 'production')
})

test('loadedGenerated sets server port from url without port', (t) => {
  const config = t.context.config
  config.loadGenerated()

  t.is(config.get('server.port'), 80)
})

test('loadedGenerated sets server port from url with port', (t) => {
  const config = t.context.config
  config.set('server.url', 'http://localhost:3000')
  config.loadGenerated()

  t.is(config.get('server.port'), 3000)
})

test('loadedGenerated sets houston version', (t) => {
  const config = t.context.config
  config.loadGenerated()

  t.is(config.get('houston.version'), pkg.version)
})

test('loadedGenerated sets houston commit', async (t) => {
  const gitPath = path.resolve(alias.resolve.alias['root'], '.git', 'ORIG_HEAD')
  const gitCommit = await new Promise((resolve, reject) => {
    fs.readFile(gitPath, { encoding: 'utf8' }, (err, data) => {
      if (err) return reject(err)
      return resolve(data.trim())
    })
  })
  .catch(() => null)

  const config = t.context.config
  await config.loadGenerated()

  if (gitCommit == null) {
    t.false(config.has('houston.commit'))
  } else {
    t.is(config.get('houston.commit'), gitCommit)
  }
})

test('loadFile throws error if file does not exist', (t) => {
  const config = new Config()

  t.throws(() => config.loadFile(path.resolve(__dirname, 'nonexistant.js')))
})

test('loadFile loads file accuratly', (t) => {
  const config = new Config()
  config.loadFile(path.resolve(alias.resolve.alias['test'], 'fixtures', 'config.js'))

  t.is(config.get('env'), 'test')
})

test('loadEnv sets environment with NODE_ENV', (t) => {
  const config = new Config()
  process.env['NODE_ENV'] = 'testing'
  config.loadEnv()

  t.is(config.get('env'), 'testing')
})

test('loadEnv sets all ports with PORT', (t) => {
  const config = new Config()
  process.env['PORT'] = '8000'
  config.loadEnv()

  t.is(config.get('server.port'), 8000)
  t.is(config.get('downloads.port'), 8000)
})

test('loadEnv sets all config with HOUSTON_ prefixed values', (t) => {
  const config = new Config()
  process.env['HOUSTON_ENV'] = 'testing'
  process.env['HOUSTON_DOWNLOADS_PORT'] = 9283
  config.loadEnv()

  t.is(config.get('env'), 'testing')
  t.is(config.get('downloads.port'), 9283)
})

test('check ensures needed keys exist', (t) => {
  const config = t.context.config
  const keys = config.check()

  t.true(keys.indexOf('env') === -1)
  t.true(keys.indexOf('server.url') === -1)

  t.false(keys.indexOf('database') === -1)
})
