/**
 * houston/src/lib/utility/rdnn.spec.ts
 * Tests RDNN functions
 */

import * as rdnn from './rdnn'

test('converts spaces to underscores', () => {
  const str = rdnn.sanitize('com.github.btkostner.this is a repo')

  expect(str).toEqual('com.github.btkostner.this_is_a_repo')
})

test('converts any dashes to underscores', () => {
  const str = rdnn.sanitize('com.github.btkostner.this-is-a-repo')

  expect(str).toEqual('com.github.btkostner.this_is_a_repo')
})

test('adds underscore before number starting section', () => {
  const str = rdnn.sanitize('com.github.4u.2test')

  expect(str).toEqual('com.github._4u._2test')
})

test('can convert 7-zip.org Archiver correctly', () => {
  const str = rdnn.sanitize('org.7-zip.archiver')

  expect(str).toEqual('org._7_zip.archiver')
})

test('it lowercases everything', () => {
  const str = rdnn.sanitize('com.github.Username.RePoSiToRy')

  expect(str).toEqual('com.github.username.repository')
})
