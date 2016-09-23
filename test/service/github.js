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

import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'

const publicKey = path.resolve(alias.resolve.alias['test'], 'fixtures', 'github', 'public.pem')

test.beforeEach((t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

  nock.disableNetConnect() // Disables all real HTTP requests

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

  nock('https://api.github.com:443', { encodedQueryParams: true })
  .matchHeader('Accept', 'application/vnd.github.machine-man-preview+json')
  .matchHeader('Authorization', /Bearer [a-z\d]{30,}/i)
  .post('/installations/1/access_tokens')
  .reply(201, {
    token: 'v1.48b9a4we891aw9f9a4bv8we9a165hj4r89tjsdfh',
    'expires_at': '2016-09-23T21:26:26Z',
    'on_behalf_of': null
  }, {
    server: 'GitHub.com',
    date: 'Fri, 23 Sep 2016 20:26:26 GMT',
    'content-type': 'application/json; charset=utf-8',
    'content-length': '111',
    connection: 'close',
    status: '201 Created',
    'cache-control': 'public, max-age=60, s-maxage=60',
    vary: 'Accept, Accept-Encoding',
    etag: '"a8e448a94v8w198bvw4e846efwefxd34"',
    'x-github-media-type': 'github.machine-man-preview; format=json',
    'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
    'access-control-allow-origin': '*',
    'content-security-policy': 'default-src \'none\'',
    'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'deny',
    'x-xss-protection': '1; mode=block',
    'x-served-by': 'w498ve4q56189w48e9g4s5a6d41189wf',
    'x-github-request-id': '12457896:7384:4857186:94875132'
  })

  const one = await github.generateToken(1)

  t.is(one, 'v1.48b9a4we891aw9f9a4bv8we9a165hj4r89tjsdfh')
})
