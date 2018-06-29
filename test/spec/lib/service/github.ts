/**
 * houston/test/spec/lib/service/github.ts
 * Tests the GitHub class.
 */

import { test } from 'ava'
import * as path from 'path'

import { GitHub } from '../../../../src/lib/service/github'
import * as type from '../../../../src/lib/service/type'

test('url returns correct string without authentication', (t) => {
  const repo = new GitHub('https://github.com/elementary/houston')

  t.is(repo.url, 'https://github.com/elementary/houston.git')
})

test('url returns correct string with authentication', (t) => {
  const repo = new GitHub('https://:fakeauthcode@github.com/elementary/houston')

  t.is(repo.url, 'https://x-access-token:fakeauthcode@github.com/elementary/houston.git')
})

test('can set values based on url', (t) => {
  const repo = new GitHub('https://github.com/noop/repo')

  repo.url = 'https://github.com/elementary/houston'

  t.is(repo.username, 'elementary')
  t.is(repo.repository, 'houston')
})

test('can set values based on url with auth', (t) => {
  const repo = new GitHub('https://test@github.com/test/test')

  repo.url = 'https://auth@github.com/elementary/houston'

  t.is(repo.username, 'elementary')
  t.is(repo.repository, 'houston')
  t.is(repo.auth, 'auth')
})

test('can set values based on ssh url', (t) => {
  const repo = new GitHub('https://test@github.com/test/test')

  repo.url = 'git@github.com:elementary/houston.git'

  t.is(repo.username, 'elementary')
  t.is(repo.repository, 'houston')
})
