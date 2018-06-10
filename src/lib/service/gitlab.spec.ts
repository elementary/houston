/**
 * houston/src/lib/service/github.spec.ts
 * Tests the GitLab class.
 */


import { GitLab } from './gitlab'

test('url returns correct string without authentication', () => {
  const repo = new GitLab('https://gitlab.com/elementary/houston')

  expect(repo.url).toEqual('https://gitlab.com/elementary/houston.git')
})

test('url returns correct string with authentication', () => {
  const repo = new GitLab('https://:fakeauthcode@gitlab.com/elementary/houston')

  expect(repo.url).toEqual('https://x-access-token:fakeauthcode@gitlab.com/elementary/houston.git')
})

test('can set values based on url', () => {
  const repo = new GitLab('https://gitlab.com/noop/repo')

  repo.url = 'https://gitlab.com/elementary/houston'

  expect(repo.username).toEqual('elementary')
  expect(repo.repository).toEqual('houston')
})

test('can set values based on url with auth', () => {
  const repo = new GitLab('https://test@gitlab.com/test/test')

  repo.url = 'https://auth@gitlab.com/elementary/houston'

  expect(repo.username).toEqual('elementary')
  expect(repo.repository).toEqual('houston')
  expect(repo.auth).toEqual('auth')
})

test('can set values based on ssh url', () => {
  const repo = new GitLab('https://test@gitlab.com/test/test')

  repo.url = 'git@gitlab.com:elementary/houston.git'

  expect(repo.username).toEqual('elementary')
  expect(repo.repository).toEqual('houston')
})
