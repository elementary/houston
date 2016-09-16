/**
 * test/lib/mistake.js
 * Tests the ability of the mistake error class
 */

import test from 'ava'

import Mistake from '~/lib/mistake'

test('is an error', (t) => {
  t.true(Mistake.prototype instanceof Error)
})

test('sets expose accuratly', (t) => {
  const one = new Mistake(500, 'a 500 error')
  const two = new Mistake(404, 'a 404 error')
  const three = new Mistake(999, 'a 999 error?')

  t.false(one.expose)
  t.true(two.expose)
  t.false(three.expose)
})

test('appropriately uses given errors', (t) => {
  const one = new Error('an error')
  const two = new Mistake(500, 'a 500 error', one)

  t.is(two.message, 'a 500 error')
  t.is(one.stack, two.stack)
})

test('takes arguments in any order', (t) => {
  const one = new Error('an error')
  const two = new Mistake(101, 'a 101 error', one)
  const three = new Mistake('a mistake', one, true)
  const four = new Mistake(one, 499, 'a 499 error', false)
  const five = new Mistake(500, true, one)

  t.is(two.status, 101)
  t.is(two.message, 'a 101 error')
  t.is(two.stack, one.stack)

  t.is(three.message, 'a mistake')
  t.is(three.stack, one.stack)
  t.true(three.expose)

  t.is(four.stack, one.stack)
  t.is(four.status, 499)
  t.is(four.message, 'a 499 error')
  t.false(four.expose)

  t.is(five.status, 500)
  t.true(five.expose)
  t.is(five.stack, one.stack)
})
