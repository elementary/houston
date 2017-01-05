/**
 * test/lib/database/master.js
 * Tests common database functions
 * NOTE: eslint disabled for special sanatizing tests
 */

 /* eslint-disable no-template-curly-in-string */
 /* eslint-disable no-useless-escape */

import test from 'ava'

import Master from 'lib/database/master'

test('sanatize does nothing with regular text', (t) => {
  t.is(Master.sanatize('$%\9sethisistext☺'), '$%\9sethisistext☺')
})

test('sanatize strips object like text', (t) => {
  const one = Master.sanatize({
    $or: null,
    $and: undefined,
    name: 'Jon'
  })

  t.is(one['$or'], undefined)
  t.is(one['$and'], undefined)
  t.is(one['name'], 'Jon')
})
