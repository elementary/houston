/**
 * test/flightcheck/file/parsable.js
 * Tests general Parsable class methods
 */

import mock from 'mock-require'
import path from 'path'
import Promise from 'bluebird'
import test from 'ava'

import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'

const fs = Promise.promisifyAll(require('fs'))

test.beforeEach('setup', (t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

  t.context.Parsable = require(path.resolve(alias.resolve.alias['flightcheck'], 'file', 'parsable')).default

  t.context.fixtures = path.resolve(__dirname, 'fixtures')
  t.context.build = path.resolve(alias.resolve.alias['build'], 'test', 'flightcheck', 'file', 'parsable')
})

test('able to create simple File', (t) => {
  t.notThrows(() => new t.context.Parsable('path', undefined, 'json'))

  t.throws(() => new t.context.Parsable('path'))
  t.throws(() => new t.context.Parsable('path', undefined, 'failformat'))
})

test('able to parse a file', async (t) => {
  const one = new t.context.Parsable(path.join(t.context.fixtures, 'test2.json'), undefined, 'json')

  const data = await one.parse()

  t.deepEqual(data, { test: 'testing parsable' })
})

test('able to stringify a file', async (t) => {
  const onePath = path.join(t.context.build, 'test1.json')
  const one = new t.context.Parsable(onePath, 'json')

  const data = { test: 'testing stringify' }

  await one.stringify(data)

  const two = await fs.readFileAsync(onePath, { encoding: 'utf8' })
  t.deepEqual(JSON.parse(two), data)
})
