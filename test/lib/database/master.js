/**
 * test/lib/database/master.js
 * Tests common database functions
 * NOTE: eslint disabled for special sanatizing tests
 */

 /* eslint-disable no-template-curly-in-string */
 /* eslint-disable no-useless-escape */

import test from 'ava'
import mock from 'mock-require'
import path from 'path'

import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'

test.beforeEach((t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

  t.context.Master = require(path.resolve(alias.resolve.alias['lib'], 'database', 'master')).default
})

test('sanatize does nothing with regular text', (t) => {
  const Master = t.context.Master

  t.is(Master.sanatize('$%\9sethisistext☺'), '$%\9sethisistext☺')
})

test('sanatize strips object like text', (t) => {
  const Master = t.context.Master

  const one = Master.sanatize({
    $or: null,
    $and: undefined,
    name: 'Jon'
  })

  t.is(one['$or'], undefined)
  t.is(one['$and'], undefined)
  t.is(one['name'], 'Jon')
})
