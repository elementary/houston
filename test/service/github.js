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

test.skip('Can generate an accurate token', async (t) => {
  const github = t.context.github

  nock.recorder.rec({
    logging: (c) => fs.appendFile('record.txt', c)
  })

  const one = await github.generateToken()

  // eslint-disable-next-line
  console.log(one)
})
