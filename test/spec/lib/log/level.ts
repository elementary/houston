/**
 * houston/test/spec/lib/log/log.ts
 * Tests the log class.
 * NOTE: Because of typescript enum values, we compare the enum index value
 */

import { Macro, test } from 'ava'

import * as Level from '../../../../src/lib/log/level'

const testParseLevel: Macro = (t, input: string, expected: number) => {
  t.is(Level.parseLevel(input), expected)
}

testParseLevel.title = (_, input: string, expected: number) => {
  return `parseLevel ${input} = ${expected}`
}

const testLevelString: Macro = (t, input: number, expected: string) => {
  t.is(Level.levelString(input), expected)
}

testLevelString.title = (_, input: string, expected: number) => {
  return `levelString ${input} = ${expected}`
}

test(testParseLevel, 'DEBUG', 0)
test(testParseLevel, 'debug', 0)
test(testParseLevel, 'info', 1)
test(testParseLevel, 'warn', 2)
test(testParseLevel, 'error', 3)

test(testLevelString, 0, 'debug')
test(testLevelString, 1, 'info')
test(testLevelString, 2, 'warn')
test(testLevelString, 3, 'error')

test('returns a default value if no matching level found', (t) => {
  t.is(Level.parseLevel('noop'), 1)
})
