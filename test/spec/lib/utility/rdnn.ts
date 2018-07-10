/**
 * houston/test/spec/lib/utility/rdnn.ts
 * Tests RDNN functions
 */

import { Macro, test } from 'ava'

import * as rdnn from '../../../../src/lib/utility/rdnn'

const sanitize: Macro = (t, input: string, expected: string) => {
  t.is(rdnn.sanitize(input), expected)
}

sanitize.title = (t, input: string, expected: string) => {
  return `sanitize converts "${input}" to "${expected}"`
}

test(sanitize, 'com.github.btkostner.this is a repo', 'com.github.btkostner.this_is_a_repo')
test(sanitize, 'com.github.btkostner.this-is-a-repo', 'com.github.btkostner.this_is_a_repo')
test(sanitize, 'com.github.4u.2test', 'com.github._4u._2test')
test(sanitize, 'org.7-zip.archiver', 'org._7_zip.archiver')
test(sanitize, 'com.github.Username.RePoSiToRy', 'com.github.username.repository')

test('sanitize uses normalizer string', (t) => {
  const input = 'com.github.testing.this-domain'
  const expected = 'com.github.testing.thisisadomain'

  t.is(rdnn.sanitize(input, 'isa'), expected)
})
