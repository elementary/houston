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

import * as helper from './helpers/github'
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

  helper.mock('/installations/1/access_tokens', {
    token: 'v1.48b9a4we891aw9f9a4bv8we9a165hj4r89tjsdfh',
    'expires_at': '2016-09-23T21:26:26Z',
    'on_behalf_of': null
  }, 201)

  const one = await github.generateToken(1)

  t.is(one, 'v1.48b9a4we891aw9f9a4bv8we9a165hj4r89tjsdfh')
})

test('Uses token cache', async (t) => {
  const github = t.context.github

  helper.mock('/installations/1/access_tokens', {
    token: 'v1.48b9a4we891aw9f9a4bv8we9a165hj4r89tjsdfh',
    'expires_at': moment().add(1, 'hours').toISOString(),
    'on_behalf_of': null
  }, 201)

  helper.mock('/installations/2/access_tokens', {
    token: 'v1.afj9830jf0a293jf0aj30f9jaw30f9jaw039fj0a',
    'expires_at': moment().add(1, 'hours').toISOString(),
    'on_behalf_of': null
  }, 201)

  const one = await github.generateToken(1)
  const two = await github.generateToken(1)
  const three = await github.generateToken(2)
  const four = await github.generateToken(2)

  t.throws(github.generateToken(3))

  t.is(one, 'v1.48b9a4we891aw9f9a4bv8we9a165hj4r89tjsdfh')
  t.is(two, one)
  t.is(three, 'v1.afj9830jf0a293jf0aj30f9jaw30f9jaw039fj0a')
  t.is(three, four)
})
