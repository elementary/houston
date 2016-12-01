/**
 * test/flightcheck/file/package.js
 * Tests general Package class methods
 */

import test from 'ava'

import Package from 'flightcheck/file/package'

test('able to create simple Package', (t) => {
  t.notThrows(() => new Package('testing', 'deb'))
  t.notThrows(() => new Package('testing', 'superawesomepack'))
  t.notThrows(() => new Package('testing', 'deb', 'amd64', 'xenial'))

  t.throws(() => new Package('testing'))
  t.throws(() => new Package('testing', 'n'))
})
