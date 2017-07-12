/**
 * test/houston/controller/api/payments.js
 * Tests the payment API endpoints
 */

import mock from 'mock-require'
import nock from 'nock'
import path from 'path'
import request from 'supertest'
import test from 'ava'

import * as stripeFixture from 'test/service/fixtures/stripe'
import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'

mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

import config from 'lib/config'
import database from 'lib/database/connection'
import Project from 'lib/database/project'
import server from 'houston/index'

database.connect(config.database)

const GOLD_REQ = {
  key: 'pk_123',
  token: 'tok_321',
  amount: 2000,
  currency: 'USD'
}

nock.disableNetConnect() // Disables all real HTTP requests
nock.enableNetConnect('127.0.0.1')

/**
 * containsError
 * Searches JSON API error array to find one that contains string
 *
 * @param {Object} res - Response
 * @param {String} str - String to search for in errors
 *
 * @throws {Error} - if response does not contain str
 * @returns {Object} - JSON API error object
 */
const containsError = (res, str) => {
  if (res == null || res.body == null || res.body.errors == null) {
    throw new Error('Response does not contain error array')
  }

  const needle = str.toLowerCase()

  const error = res.body.errors.find((err) => {
    if (err.title != null && err.title.toLowerCase().includes(needle)) return true
    if (err.detail != null && err.detail.toLowerCase().includes(needle)) return true
    return false
  })

  if (error == null) {
    throw new Error(`Response does not include error with phrase "${needle}"`)
  }

  return error
}

test('Returns 400 with invalid Project', (t) => {
  return request(server.listen())
  .get('/api/payment/invalidName')
  .set('Accept', 'application/vnd.api+json')
  .set('Content-Type', 'application/vnd.api+json')
  .expect(400)
  .expect((res) => containsError(res, 'project'))
})

test('Returns 404 with unknown Project', (t) => {
  return request(server.listen())
  .get('/api/payment/com.testing.apipayments.0')
  .set('Accept', 'application/vnd.api+json')
  .set('Content-Type', 'application/vnd.api+json')
  .expect(404)
  .expect((res) => containsError(res, 'project'))
})

test('Returns 400 with disabled Project', async (t) => {
  await Project.remove({ name: 'com.testing.apipayments.1' })

  await Project.create({
    name: 'com.testing.apipayments.1',
    repo: 'https://testing.com/apipayments/1.git',
    'github.id': 431242,
    'stripe.enabled': false
  })

  return request(server.listen())
  .get('/api/payment/com.testing.apipayments.1')
  .set('Accept', 'application/vnd.api+json')
  .set('Content-Type', 'application/vnd.api+json')
  .expect(400)
  .expect((res) => containsError(res, 'enabled'))
})

test('Returns key with enabled Project', async (t) => {
  await Project.remove({ name: 'com.testing.apipayments.2' })

  await Project.create({
    name: 'com.testing.apipayments.2',
    repo: 'https://testing.com/apipayments/2.git',
    'github.id': 412489,
    'stripe.enabled': true,
    'stripe.id': 'acct_123',
    'stripe.access': 'tok_123',
    'stripe.public': 'pk_123'
  })

  return request(server.listen())
  .get('/api/payment/com.testing.apipayments.2')
  .set('Accept', 'application/vnd.api+json')
  .set('Content-Type', 'application/vnd.api+json')
  .expect(200)
  .expect((res) => (res.body.name === 'com.testing.apipayments.2'))
  .expect((res) => (res.body.key === 'testingkey'))
})

test('Returns 400 with missing Project key', async (t) => {
  await Project.remove({ name: 'com.testing.apipayments.3' })

  await Project.create({
    name: 'com.testing.apipayments.3',
    repo: 'https://testing.com/apipayments/3.git',
    'github.id': 448912,
    'stripe.enabled': true,
    'stripe.id': 'acct_123',
    'stripe.access': 'tok_123',
    'stripe.public': 'pk_123'
  })

  return request(server.listen())
  .post('/api/payment/com.testing.apipayments.3')
  .set('Accept', 'application/vnd.api+json')
  .set('Content-Type', 'application/vnd.api+json')
  .send({
    data: Object.assign({}, GOLD_REQ, {
      key: null
    })
  })
  .expect(400)
  .expect((res) => containsError(res, 'key'))
})

test('Returns 400 with incorrect Project key', async (t) => {
  await Project.remove({ name: 'com.testing.apipayments.4' })

  await Project.create({
    name: 'com.testing.apipayments.4',
    repo: 'https://testing.com/apipayments/4.git',
    'github.id': 791567,
    'stripe.enabled': true,
    'stripe.id': 'acct_123',
    'stripe.access': 'tok_123',
    'stripe.public': 'pk_123'
  })

  return request(server.listen())
  .post('/api/payment/com.testing.apipayments.4')
  .set('Accept', 'application/vnd.api+json')
  .set('Content-Type', 'application/vnd.api+json')
  .send({
    data: Object.assign({}, GOLD_REQ, {
      key: 'thisisinvalidkey'
    })
  })
  .expect(400)
  .expect((res) => containsError(res, 'key'))
})

test('Returns 400 with missing Project token', async (t) => {
  await Project.remove({ name: 'com.testing.apipayments.5' })

  await Project.create({
    name: 'com.testing.apipayments.5',
    repo: 'https://testing.com/apipayments/5.git',
    'github.id': 795723,
    'stripe.enabled': true,
    'stripe.id': 'acct_123',
    'stripe.access': 'tok_123',
    'stripe.public': 'pk_123'
  })

  return request(server.listen())
  .post('/api/payment/com.testing.apipayments.5')
  .set('Accept', 'application/vnd.api+json')
  .set('Content-Type', 'application/vnd.api+json')
  .send({
    data: Object.assign({}, GOLD_REQ, {
      token: null
    })
  })
  .expect(400)
  .expect((res) => containsError(res, 'token'))
})

test('Returns 400 with incorrect Project token', async (t) => {
  await Project.remove({ name: 'com.testing.apipayments.6' })

  await Project.create({
    name: 'com.testing.apipayments.6',
    repo: 'https://testing.com/apipayments/6.git',
    'github.id': 134876,
    'stripe.enabled': true,
    'stripe.id': 'acct_123',
    'stripe.access': 'tok_123',
    'stripe.public': 'pk_123'
  })

  return request(server.listen())
  .post('/api/payment/com.testing.apipayments.6')
  .set('Accept', 'application/vnd.api+json')
  .set('Content-Type', 'application/vnd.api+json')
  .send({
    data: Object.assign({}, GOLD_REQ, {
      token: 'thisisinvalidkey'
    })
  })
  .expect(400)
  .expect((res) => containsError(res, 'token'))
})

test('Returns 400 with negative payment amount', async (t) => {
  await Project.remove({ name: 'com.testing.apipayments.7' })

  await Project.create({
    name: 'com.testing.apipayments.7',
    repo: 'https://testing.com/apipayments/7.git',
    'github.id': 843752,
    'stripe.enabled': true,
    'stripe.id': 'acct_123',
    'stripe.access': 'tok_123',
    'stripe.public': 'pk_123'
  })

  return request(server.listen())
  .post('/api/payment/com.testing.apipayments.7')
  .set('Accept', 'application/vnd.api+json')
  .set('Content-Type', 'application/vnd.api+json')
  .send({
    data: Object.assign({}, GOLD_REQ, {
      amount: 'testing'
    })
  })
  .expect(400)
  .expect((res) => containsError(res, 'amount'))
})

test('Returns 400 with incorrect payment amount type', async (t) => {
  await Project.remove({ name: 'com.testing.apipayments.8' })

  await Project.create({
    name: 'com.testing.apipayments.8',
    repo: 'https://testing.com/apipayments/8.git',
    'github.id': 346275,
    'stripe.enabled': true,
    'stripe.id': 'acct_123',
    'stripe.access': 'tok_123',
    'stripe.public': 'pk_123'
  })

  return request(server.listen())
  .post('/api/payment/com.testing.apipayments.8')
  .set('Accept', 'application/vnd.api+json')
  .set('Content-Type', 'application/vnd.api+json')
  .send({
    data: Object.assign({}, GOLD_REQ, {
      amount: 'thisneedstobeanumber'
    })
  })
  .expect(400)
  .expect((res) => containsError(res, 'amount'))
})

test('Returns 400 with payment amount less than $1', async (t) => {
  await Project.remove({ name: 'com.testing.apipayments.9' })

  await Project.create({
    name: 'com.testing.apipayments.9',
    repo: 'https://testing.com/apipayments/9.git',
    'github.id': 671284,
    'stripe.enabled': true,
    'stripe.id': 'acct_123',
    'stripe.access': 'tok_123',
    'stripe.public': 'pk_123'
  })

  return request(server.listen())
  .post('/api/payment/com.testing.apipayments.9')
  .set('Accept', 'application/vnd.api+json')
  .set('Content-Type', 'application/vnd.api+json')
  .send({
    data: Object.assign({}, GOLD_REQ, {
      amount: 10
    })
  })
  .expect(400)
  .expect((res) => containsError(res, 'amount'))
})

test('Returns 400 with missing payment currency', async (t) => {
  await Project.remove({ name: 'com.testing.apipayments.10' })

  await Project.create({
    name: 'com.testing.apipayments.10',
    repo: 'https://testing.com/apipayments/10.git',
    'github.id': 497615,
    'stripe.enabled': true,
    'stripe.id': 'acct_123',
    'stripe.access': 'tok_123',
    'stripe.public': 'pk_123'
  })

  return request(server.listen())
  .post('/api/payment/com.testing.apipayments.10')
  .set('Accept', 'application/vnd.api+json')
  .set('Content-Type', 'application/vnd.api+json')
  .send({
    data: Object.assign({}, GOLD_REQ, {
      currency: null
    })
  })
  .expect(400)
  .expect((res) => containsError(res, 'currency'))
})

test('Returns 400 with payment currency not USD', async (t) => {
  await Project.remove({ name: 'com.testing.apipayments.11' })

  await Project.create({
    name: 'com.testing.apipayments.11',
    repo: 'https://testing.com/apipayments/11.git',
    'github.id': 673154,
    'stripe.enabled': true,
    'stripe.id': 'acct_123',
    'stripe.access': 'tok_123',
    'stripe.public': 'pk_123'
  })

  return request(server.listen())
  .post('/api/payment/com.testing.apipayments.11')
  .set('Accept', 'application/vnd.api+json')
  .set('Content-Type', 'application/vnd.api+json')
  .send({
    data: Object.assign({}, GOLD_REQ, {
      currency: 'JPY'
    })
  })
  .expect(400)
  .expect((res) => containsError(res, 'currency'))
})

test('Returns 200 with successful payment', async (t) => {
  await Project.remove({ name: 'com.testing.apipayments.12' })

  await Project.create({
    name: 'com.testing.apipayments.12',
    repo: 'https://testing.com/apipayments/12.git',
    'github.id': 376451,
    'stripe.enabled': true,
    'stripe.id': 'acct_123',
    'stripe.access': 'tok_123',
    'stripe.public': 'pk_123'
  })

  nock('https://api.stripe.com:443', { encodedQueryParams: true })
  .replyContentLength()
  .replyDate()
  .post('/v1/charges', 'amount=1000&currency=USD&description=Payment%20for%20com.testing.apipayments.12&source=tok_321&destination%5Baccount%5D=acct_123&destination%5Bamount%5D=700')
  .reply(200, stripeFixture.mockCharge(), stripeFixture.header)

  return request(server.listen())
  .post('/api/payment/com.testing.apipayments.12')
  .set('Accept', 'application/vnd.api+json')
  .set('Content-Type', 'application/vnd.api+json')
  .send({
    data: Object.assign({}, GOLD_REQ, {
      key: 'pk_123',
      token: 'tok_321',
      amount: 1000,
      currency: 'USD'
    })
  })
  .expect(200)
  .expect((res) => (res.body.data.name === 'com.testing.apipayments.12'))
  .expect((res) => (res.body.data.key === 'pk_123'))
  .expect((res) => (res.body.data.amount === 1000))
})
