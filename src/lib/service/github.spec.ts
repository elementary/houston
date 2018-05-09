/**
 * houston/src/lib/service/github.spec.ts
 * Tests the GitHub class.
 */

import * as path from 'path'

import { record } from '../../../test/utility/http'
import { GitHub } from './github'
import * as type from './type'

test('url returns correct string without authentication', () => {
  const repo = new GitHub('https://github.com/elementary/houston')

  expect(repo.url).toEqual('https://github.com/elementary/houston.git')
})

test('url returns correct string with authentication', () => {
  const repo = new GitHub('https://fakeauthcode@github.com/elementary/houston')

  expect(repo.url).toEqual('https://fakeauthcode@github.com/elementary/houston.git')
})

test('can set values based on url', () => {
  const repo = new GitHub('https://github.com/noop/repo')

  repo.url = 'https://github.com/elementary/houston'

  expect(repo.username).toEqual('elementary')
  expect(repo.repository).toEqual('houston')
})

test('can set values based on url with auth', () => {
  const repo = new GitHub('https://test@github.com/test/test')

  repo.url = 'https://auth@github.com/elementary/houston'

  expect(repo.username).toEqual('elementary')
  expect(repo.repository).toEqual('houston')
  expect(repo.auth).toEqual('auth')
})

test('can set values based on ssh url', () => {
  const repo = new GitHub('https://test@github.com/test/test')

  repo.url = 'git@github.com:elementary/houston.git'

  expect(repo.username).toEqual('elementary')
  expect(repo.repository).toEqual('houston')
  expect(repo.auth).toEqual('test')
})

test('can post assets to reference', async () => {
  const { done } = await record('lib/service/github/asset.json')
  const repo = new GitHub('https://github.com/btkostner/vocal')
  const pkg = {
    architecture: 'amd64',
    description: 'Vocal 3.2.6 Loki (amd64)',
    distribution: 'xenial',
    name: 'package.deb',
    path: path.resolve(__dirname, '../../../test/fixture/lib/service/github/vocal.deb'),
    type: 'deb'
  } as type.IPackage

  const newPkg = await repo.uploadPackage(pkg, 'review', '3.2.6')

  expect(newPkg.githubId).toBe(6174740)

  await done()
})
