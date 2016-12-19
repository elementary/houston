/**
 * test/houston/controller/api/helpers.js
 * Tests the JSON API helper functions
 */

import mock from 'mock-require'
import path from 'path'
import test from 'ava'

import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'

test.beforeEach((t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

  t.context.APIError = require(path.resolve(alias.resolve.alias['houston'], 'controller', 'api', 'error')).default
  t.context.helpers = require(path.resolve(alias.resolve.alias['houston'], 'controller', 'api', 'helpers'))
})

test('nameifies raw input', (t) => {
  t.is(t.context.helpers.nameify('com.github.elementary.houston'), 'com.github.elementary.houston')
  t.is(t.context.helpers.nameify('com.github.&j389%*#$&fj9vj02.j9fjv$@#%$203u0=-2f'), 'com.github.j389fj9vj02.j9fjv203u0-2f')

  t.throws(() => t.context.helpers.nameify('com'), t.context.APIError)
  t.throws(() => t.context.helpers.nameify('29fj23f.j922c3'), t.context.APIError)
})
