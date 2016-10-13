/**
 * test/service/github.js
 * Tests GitHub third party functions
 */

import fs from 'fs'
import jwt from 'jsonwebtoken'
import mock from 'mock-require'
import moment from 'moment'
import nock from 'nock'
import path from 'path'
import test from 'ava'

import * as fixture from './fixtures/github'
import * as helper from './helpers/github'
import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'

const publicKey = path.resolve(alias.resolve.alias['test'], 'fixtures', 'github', 'public.pem')

test.before((t) => {
  // This will capture any incoming data and put it to a file.
  // Use it for verifying we are testing real data.
  // Make sure to enable net connect and disable the tests you don't want
  // to run with `test.skip()`!
  // nock.recorder.rec({
  //   logging: (context) => fs.appendFile('github.log', context)
  // })

  nock.disableNetConnect() // Disables all real HTTP requests
})

test.beforeEach((t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

  t.context.config = require(path.resolve(alias.resolve.alias['lib'], 'config')).default
  t.context.github = require(path.resolve(alias.resolve.alias['service'], 'github'))
})

test('GitHubError has correct error code', (t) => {
  const github = t.context.github

  const one = new github.GitHubError('testing')

  t.is(one.code, 'GTHERR')
})

test('Can generate an accurate JWT', async (t) => {
  const config = t.context.config
  const github = t.context.github

  const verify = (token) => new Promise((resolve, reject) => {
    fs.readFile(publicKey, (err, key) => {
      if (err) return reject(err)

      jwt.verify(token, key, (err, payload) => {
        if (err) return reject(err)
        return resolve(payload)
      })
    })
  })

  const futureDate = moment().add(10, 'hours').toDate()

  const one = await github.generateJWT()
  const two = await github.generateJWT(futureDate)

  t.is(typeof one, 'string')
  t.is(typeof two, 'string')

  const three = await verify(one)
  const four = await verify(two)

  t.is(typeof three, 'object')
  t.is(typeof four, 'object')
  t.is(three.iss, config.github.integration.id)
  t.is(four.iss, config.github.integration.id)
  t.true(three.iat < new Date().getTime())
  t.true(four.iat < new Date().getTime())
  t.true(three.exp > Math.floor(Date.now() / 1000))
  t.true(four.exp === Math.floor(futureDate.getTime() / 1000))
})

test('Can generate an accurate token', async (t) => {
  const github = t.context.github

  helper.mockPost('/installations/1/access_tokens', {
    token: 'v1.48b9a4we891aw9f9a4bv8we9a165hj4r89tjsdfh',
    'expires_at': '2016-09-23T21:26:26Z',
    'on_behalf_of': null
  }, 201, true)

  const one = await github.generateToken(1)

  t.is(one, 'v1.48b9a4we891aw9f9a4bv8we9a165hj4r89tjsdfh')
})

test('Uses token cache', async (t) => {
  const github = t.context.github

  // NOTE: we only mock each endpoint ONCE. if you get to this point due to an
  // 'Unable to generate authentication token' it's most likely because the
  // cache failed and we are trying to connect to GitHub again.
  helper.mockPost('/installations/1/access_tokens', {
    token: 'v1.48b9a4we891aw9f9a4bv8we9a165hj4r89tjsdfh',
    'expires_at': moment().add(1, 'hours').toISOString(),
    'on_behalf_of': null
  }, 201, true)

  helper.mockPost('/installations/2/access_tokens', {
    token: 'v1.afj9830jf0a293jf0aj30f9jaw30f9jaw039fj0a',
    'expires_at': moment().add(1, 'hours').toISOString(),
    'on_behalf_of': null
  }, 201, true)

  const one = await github.generateToken(1)
  const two = await github.generateToken(2)

  t.is(one, 'v1.48b9a4we891aw9f9a4bv8we9a165hj4r89tjsdfh')
  t.is(two, 'v1.afj9830jf0a293jf0aj30f9jaw30f9jaw039fj0a')

  t.throws(github.generateToken(3))

  // Due to async nature we timeout to prevent a race condition
  setTimeout(async () => {
    const three = await github.generateToken(1)
    const four = await github.generateToken(2)

    t.is(one, three)
    t.is(two, four)
  }, 1000)
})

test('Can get list of repos', async (t) => {
  const github = t.context.github

  helper.mockGet('/user/repos', fixture.repos)

  const one = await github.getRepos('testingToken')

  t.is(typeof one, 'object')
  t.is(one[0].name, 'com.github.elementary.test1')
  t.is(one[0].repo, 'git:github.com/elementary/test1.git')
  t.is(one[0].github.id, 1)
  t.is(typeof one[0].github.integration, 'undefined')
})

test('Can get list of releases', async (t) => {
  const github = t.context.github

  helper.mockGet('/repos/elementary/test1/releases', fixture.releases)

  const one = await github.getReleases('elementary', 'test1')

  t.is(typeof one, 'object')
  t.is(one[0].version, '1.0.0')
  t.is(one[0].github.id, 1)
  t.true(one[0].date.released instanceof Date)
})

test('Can get accurate permissions', async (t) => {
  const github = t.context.github

  helper.mockGet('/repos/elementary/test/collaborators/test1', '204: No Content', 204)
  helper.mockGet('/repos/elementary/test/collaborators/test2', '404: Not Found', 404)

  const one = await github.getPermission('elementary', 'test', 'test1')
  const two = await github.getPermission('elementary', 'test', 'test2')
  const three = await github.getPermission('elementary', 'test', 'test3')

  t.true(one)
  t.false(two)
  t.false(three)
})
