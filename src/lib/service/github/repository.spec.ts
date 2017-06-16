/**
 * houston/src/lib/service/github/repository.spec.ts
 * Tests the GitHub repository class.
 */

import { Repository } from './repository'

test('url returns correct string without authentication', () => {
  const repo = new Repository('elementary', 'houston')

  expect(repo.url).toEqual('https://github.com/elementary/houston.git')
})

test('url returns correct string with authentication', () => {
  const repo = new Repository('elementary', 'houston', 'fakeauthcode')

  expect(repo.url).toEqual('https://fakeauthcode@github.com/elementary/houston.git')
})

test('can set values based on url', () => {
  const repo = new Repository('test', 'test')

  repo.url = 'https://github.com/elementary/houston'

  expect(repo.username).toEqual('elementary')
  expect(repo.repository).toEqual('houston')
})

test('can set values based on url with auth', () => {
  const repo = new Repository('test', 'test', 'test')

  repo.url = 'https://auth@github.com/elementary/houston'

  expect(repo.username).toEqual('elementary')
  expect(repo.repository).toEqual('houston')
  expect(repo.auth).toEqual('auth')
})

test('can set values based on ssh url', () => {
  const repo = new Repository('test', 'test', 'test')

  repo.url = 'git@github.com:elementary/houston.git'

  expect(repo.username).toEqual('elementary')
  expect(repo.repository).toEqual('houston')
  expect(repo.auth).toEqual('test')
})
