/**
 * test/houston/controller/api/helpers.js
 * Tests the JSON API helper functions
 */

import mock from 'mock-require'
import path from 'path'
import test from 'ava'

import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'
import { ApplicationError } from 'lib/error/application'

test.beforeEach((t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

  t.context.helpers = require(path.resolve(alias.resolve.alias['houston'], 'controller', 'api', 'helpers'))
})

test('nameifies raw input', (t) => {
  t.is(t.context.helpers.nameify('com.github.elementary.houston'), 'com.github.elementary.houston')
  t.is(t.context.helpers.nameify('com.github.&j389%*#$&fj9vj02.j9fjv$@#%$203u0=-2f'), 'com.github.j389fj9vj02.j9fjv203u0-2f')

  t.throws(() => t.context.helpers.nameify(null), ApplicationError)
  t.throws(() => t.context.helpers.nameify(''), ApplicationError)
  t.throws(() => t.context.helpers.nameify('com'), ApplicationError)
  t.throws(() => t.context.helpers.nameify('29fj23f.j922c3'), ApplicationError)
})

test('amountifies raw input', (t) => {
  t.is(t.context.helpers.amountify('123'), 123)
  t.is(t.context.helpers.amountify('-123'), -123)
  t.is(t.context.helpers.amountify('000001'), 1)

  t.throws(() => t.context.helpers.amountify(null), ApplicationError)
  t.throws(() => t.context.helpers.amountify(''), ApplicationError)
  t.throws(() => t.context.helpers.amountify('923.23'), ApplicationError)
  t.throws(() => t.context.helpers.amountify('asdf'), ApplicationError)
  t.throws(() => t.context.helpers.amountify('-23.f3'), ApplicationError)
})
