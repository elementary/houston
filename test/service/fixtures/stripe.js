/**
 * test/service/fixtures/stripe.js
 * A monolithic file of all things raw Stripe response
 *
 * @exports {Object} header - basic Stripe headers
 * @exports {Function} mockCharge - Mocks a Stripe charge object
 */

import _ from 'lodash'

/**
 * header
 * Basic Stripe server headers for use in mocking
 */
export const header = {
  'Server': 'nginx',
  'Content-Type': 'application/json',
  'Connection': 'close',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Max-Age': '300',
  'Cache-Control': 'no-cache, no-store',
  'Request-Id': 'req_48fv518432894v',
  'Stripe-Account': 'acct_j8930zj093jfASDF',
  'Stripe-Version': '2016-03-07',
  'Strict-Transport-Security': 'max-age=31556926; includeSubDomains'
}

/**
 * mockCharge
 * Mocks a charge so you don't have to repeat things
 *
 * @param {Object} def - default values for a repo
 * @return {Object} - a mocked Stripe object
 */
export function mockCharge (def = {}) {
  return _.merge({
    'id': 'ch_4891234a4vewhj5435h3ba43',
    'object': 'charge',
    'amount': 100,
    'amount_refunded': 0,
    'application': 'ca_8494a489g4v498a1v44a89v149a34gaw',
    'application_fee': 'fee_2f3v9834gawgaw',
    'balance_transaction': 'txn_65j918939dj34934g3ah35y4',
    'captured': true,
    'created': 1482203816,
    'currency': 'usd',
    'customer': null,
    'description': 'Purchase of com.github.btkostner.vocal',
    'destination': null,
    'dispute': null,
    'failure_code': null,
    'failure_message': null,
    'fraud_details': {},
    'invoice': null,
    'livemode': false,
    'metadata': {},
    'order': null,
    'outcome': {
      'network_status': 'approved_by_network',
      'reason': null,
      'seller_message': 'Payment complete.',
      'type': 'authorized'
    },
    'paid': true,
    'receipt_email': null,
    'receipt_number': null,
    'refunded': false,
    'refunds': {
      'object': 'list',
      'data': [],
      'has_more': false,
      'total_count': 0,
      'url': '/v1/charges/ch_48918v9a4vew8b4435h3ba43/refunds'
    },
    'review': null,
    'shipping': null,
    'source': {
      'id': 'card_19Se6wGXWx8ev8vJGv4VtS86',
      'object': 'card',
      'address_city': null,
      'address_country': null,
      'address_line1': null,
      'address_line1_check': null,
      'address_line2': null,
      'address_state': null,
      'address_zip': null,
      'address_zip_check': null,
      'brand': 'Visa',
      'country': 'US',
      'customer': null,
      'cvc_check': 'pass',
      'dynamic_last4': null,
      'exp_month': 2,
      'exp_year': 2048,
      'fingerprint': 'Pdxcb3JRbijUlhR6',
      'funding': 'credit',
      'last4': '4242',
      'metadata': {},
      'name': 'ellie@elementary.io',
      'tokenization_method': null
    },
    'source_transfer': null,
    'statement_descriptor': null,
    'status': 'succeeded'
  }, def)
}
