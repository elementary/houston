/**
 * houston/src/lib/log/log.spec.ts
 * Tests the log class.
 * NOTE: Because of typescript enum values, we compare the enum index value
 */

import * as Level from './level'

test('can parse uppercase strings', () => {
  const parsed = Level.parseLevel('DEBUG')

  expect(parsed).toEqual(0)
})

test('can parse lowercase strings', () => {
  const parsed = Level.parseLevel('warn')

  expect(parsed).toEqual(2)
})

test('returns a default value if no matching level found', () => {
  const parsed = Level.parseLevel('noop')

  expect(parsed).toEqual(1)
})

test('can return a nice readable string from level', () => {
  const level = Level.levelString(3)

  expect(level).toEqual('error')
})
