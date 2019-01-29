/**
 * houston/test/spec/lib/service/github.ts
 * Tests the GitHub class.
 */

import baseTest, { TestInterface } from 'ava'
import * as path from 'path'

import { github, IGitHubFactory } from '../../../../src/lib/service'
import * as type from '../../../../src/lib/service/type'

import { create as createApp } from '../../../utility/app'

const test = baseTest as TestInterface<{
  factory: IGitHubFactory
}>

test.beforeEach(async (t) => {
  const app = await createApp()

  t.context.factory = app.get<IGitHubFactory>(github)
})

test('url returns correct string without authentication', (t) => {
  const repo = t.context.factory('https://github.com/elementary/houston')

  t.is(repo.url, 'https://github.com/elementary/houston.git')
})

test('url returns correct string with authentication', (t) => {
  const repo = t.context.factory('https://x-access-token:fakeauthcode@github.com/elementary/houston')

  t.is(repo.url, 'https://x-access-token:fakeauthcode@github.com/elementary/houston.git')
})

test('can set values based on url', (t) => {
  const repo = t.context.factory('https://github.com/noop/repo')

  repo.url = 'https://github.com/elementary/houston'

  t.is(repo.username, 'elementary')
  t.is(repo.repository, 'houston')
})

test('can set values based on url with auth', (t) => {
  const repo = t.context.factory('https://test@github.com/test/test')

  repo.url = 'https://auth@github.com/elementary/houston'

  t.is(repo.username, 'elementary')
  t.is(repo.repository, 'houston')
  t.is(repo.authUsername, 'x-access-token')
  t.is(repo.authPassword, 'auth')
})

test('can set values based on ssh url', (t) => {
  const repo = t.context.factory('https://test@github.com/test/test')

  repo.url = 'git@github.com:elementary/houston.git'

  t.is(repo.username, 'elementary')
  t.is(repo.repository, 'houston')
})
