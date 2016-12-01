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
import Parsable from 'flightcheck/file/parsable'

const fs = Promise.promisifyAll(require('fs'))

test.beforeEach('setup', (t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

  t.context.fixtures = path.resolve(__dirname, 'fixtures')
  t.context.build = path.resolve(alias.resolve.alias['build'], 'test', 'flightcheck', 'file', 'parsable')
})

test('able to create simple File', (t) => {
  t.notThrows(() => new Parsable('path', 'json'))

  t.throws(() => new Parsable('path'))
  t.throws(() => new Parsable('path', 'failformat'))
})

test('able to parse a file', async (t) => {
  const one = new Parsable(path.join(t.context.fixtures, 'test2.json'), 'json')

  const data = await one.parse()

  t.deepEqual(data, { test: 'testing parsable' })
})

test('able to stringify a file', async (t) => {
  const onePath = path.join(t.context.build, 'test1.json')
  const one = new Parsable(onePath, 'json')

  const data = { test: 'testing stringify' }

  await one.stringify(data)

  const two = await fs.readFileAsync(onePath, { encoding: 'utf8' })
  t.deepEqual(JSON.parse(two), data)
})
