/**
 * test/lib/helper/lang.js
 * Tests language capabilities
 */

import test from 'ava'

import * as lang from 'lib/helpers/lang'

test('can conver based on array length', (t) => {
  const one = lang.s('all things to singluar form', 1)
  const two = lang.s('too many people', 1)
  const three = lang.s('person thing are cat dog', 2)
  const four = lang.s('the number in array', [1, 2, 3])

  t.is(one, '1 all thing to singluar form')
  t.is(two, '1 too many person')
  t.is(three, '2 people things are cats dogs')
  t.is(four, '3 the numbers in arrays')
})
