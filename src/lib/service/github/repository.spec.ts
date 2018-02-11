/**
 * houston/src/lib/service/github/repository.spec.ts
 * Tests the GitHub repository class.
 */

import * as path from 'path'

import { record } from '../../../../test/utility/http'
import { Repository } from './repository'

test('url returns correct string without authentication', () => {
  const repo = new Repository('https://github.com/elementary/houston')

  expect(repo.url).toEqual('https://github.com/elementary/houston.git')
})

test('url returns correct string with authentication', () => {
  const repo = new Repository('https://fakeauthcode@github.com/elementary/houston')

  expect(repo.url).toEqual('https://fakeauthcode@github.com/elementary/houston.git')
})

test('can set values based on url', () => {
  const repo = new Repository('https://github.com/noop/repo')

  repo.url = 'https://github.com/elementary/houston'

  expect(repo.username).toEqual('elementary')
  expect(repo.repository).toEqual('houston')
})

test('can set values based on url with auth', () => {
  const repo = new Repository('https://test@github.com/test/test')

  repo.url = 'https://auth@github.com/elementary/houston'

  expect(repo.username).toEqual('elementary')
  expect(repo.repository).toEqual('houston')
  expect(repo.auth).toEqual('auth')
})

test('can set values based on ssh url', () => {
  const repo = new Repository('https://test@github.com/test/test')

  repo.url = 'git@github.com:elementary/houston.git'

  expect(repo.username).toEqual('elementary')
  expect(repo.repository).toEqual('houston')
  expect(repo.auth).toEqual('test')
})

test('can post assets to reference', async () => {
  const { done } = await record('lib/service/github/asset.json')
  const repo = new Repository('https://github.com/btkostner/vocal')
  const file = path.resolve(__dirname, '../../../../test/fixture/lib/service/github/vocal.deb')

  await repo.asset('3.2.6', file, 'application/vnd.debian.binary-package', 'package.deb', 'Vocal 3.2.6 Loki (amd64)')

  await done()
})
