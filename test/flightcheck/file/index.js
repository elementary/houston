/**
 * test/flightcheck/file/index.js
 * Tests general File class methods
 */

import path from 'path'
import Promise from 'bluebird'
import test from 'ava'

import { mockConfig } from 'test/helpers'
import alias from 'root/.alias'

const fs = Promise.promisifyAll(require('fs'))

test.beforeEach('setup', (t) => {
  mockConfig()

  t.context.File = require(path.resolve(alias.resolve.alias['flightcheck'], 'file', 'index')).default

  t.context.fixtures = path.resolve(__dirname, 'fixtures')
  t.context.build = path.resolve(alias.resolve.alias['build'], 'test', 'flightcheck', 'file', 'index')
})

test('able to create simple File', (t) => {
  t.notThrows(() => new t.context.File('path'))
})

test('able to check existance of a file', async (t) => {
  const one = new t.context.File(path.join(t.context.fixtures, 'test1.txt'))
  const two = new t.context.File(path.join(t.context.fixtures, 'neverexistant.txt'))

  t.true(await one.exists())
  t.false(await two.exists())
})

test('able to read a file', async (t) => {
  const one = new t.context.File(path.join(t.context.fixtures, 'test1.txt'))

  const data = await one.read()

  t.is(data, 'this is a simple text file\n')
})

test('able to write a file', async (t) => {
  const onePath = path.join(t.context.build, 'test1.txt')
  const one = new t.context.File(onePath)

  const data = 'this is some write test data\n'

  await one.write(data)

  const two = await fs.readFileAsync(onePath, { encoding: 'utf8' })
  t.is(two, data)
})
