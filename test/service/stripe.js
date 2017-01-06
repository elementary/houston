/**
 * test/service/stripe.js
 * Tests Stripe API functions
 */

import nock from 'nock'
import path from 'path'
import test from 'ava'

import { mockConfig } from 'test/helpers'
import * as fixture from './fixtures/stripe'
import alias from 'root/.alias'

test.before((t) => {
  // This will capture any incoming data and put it to a file.
  // Use it for verifying we are testing real data.
  // Make sure to enable net connect and disable the tests you don't want
  // to run with `test.skip()`!
  // nock.recorder.rec({
  //   logging: (context) => fs.appendFile('stripe.log', context)
  // })

  nock.disableNetConnect() // Disables all real HTTP requests
})

test.beforeEach((t) => {
  mockConfig()

  t.context.config = require(path.resolve(alias.resolve.alias['lib'], 'config')).default
  t.context.stripe = require(path.resolve(alias.resolve.alias['service'], 'stripe'))

  // A note to the smart people. Don't use nock cleanAll() here.
})

test('StripeError is an accurate error class', (t) => {
  const stripe = t.context.stripe

  const one = new stripe.StripeError('testing')

  t.is(one.code, 'STPERR')
  t.true(new stripe.StripeError() instanceof Error)
})

test('getCut has accurate math', (t) => {
  const stripe = t.context.stripe

  const one = stripe.getCut(100)
  const two = stripe.getCut(1000)
  const three = stripe.getCut(123456)

  t.is(one['stripe'], 33)
  t.is(one['elementary'], 17)
  t.is(one['developer'], 50)
  t.is(one['total'], 100)
  t.is(one['stripe'] + one['elementary'] + one['developer'], one['total'])

  t.is(two['stripe'], 59)
  t.is(two['elementary'], 241)
  t.is(two['developer'], 700)
  t.is(two['total'], 1000)
  t.is(two['stripe'] + two['elementary'] + two['developer'], two['total'])

  t.is(three['stripe'], 3611)
  t.is(three['elementary'], 33426)
  t.is(three['developer'], 86419)
  t.is(three['total'], 123456)
  t.is(three['stripe'] + three['elementary'] + three['developer'], three['total'])
})

test('Can post a charge', async (t) => {
  const stripe = t.context.stripe

  nock('https://api.stripe.com:443', { encodedQueryParams: true })
  .replyContentLength()
  .replyDate()
  .post('/v1/charges', 'amount=100&application_fee=17&currency=USD&description=Purchase%20of%20com.github.btkostner.vocal&source=tok_489z4f23g89489344g894d9a')
  .reply(200, fixture.mockCharge(), fixture.header)

  const one = await stripe.postCharge('acct_j8930zj093jfASDF', 'tok_489z4f23g89489344g894d9a', 100, 'USD', 'Purchase of com.github.btkostner.vocal')

  t.is(typeof one, 'string')
})
