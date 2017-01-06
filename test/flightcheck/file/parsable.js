/**
 * test/flightcheck/file/parsable.js
 * Tests general Parsable class methods
 */

import path from 'path'
import Promise from 'bluebird'
import test from 'ava'

import { mockConfig } from 'test/helpers'
import alias from 'root/.alias'

const fs = Promise.promisifyAll(require('fs'))

test.beforeEach('setup', (t) => {
  mockConfig()

  t.context.Parsable = require(path.resolve(alias.resolve.alias['flightcheck'], 'file', 'parsable')).default

  t.context.fixtures = path.resolve(__dirname, 'fixtures')
  t.context.build = path.resolve(alias.resolve.alias['build'], 'test', 'flightcheck', 'file', 'parsable')
})

test('able to create simple File', (t) => {
  t.notThrows(() => new t.context.Parsable('path', 'json'))

  t.throws(() => new t.context.Parsable('path'))
  t.throws(() => new t.context.Parsable('path', 'failformat'))
})

test('able to parse a file', async (t) => {
  const one = new t.context.Parsable(path.join(t.context.fixtures, 'test2.json'), 'json')

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
