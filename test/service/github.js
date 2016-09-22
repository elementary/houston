/**
 * test/service/github.js
 * Tests GitHub third party functions
 */

import test from 'ava'

import * as github from 'service/github'

test('GitHubError is an error', (t) => {
  const one = new github.GitHubError('testing')

  t.true(one instanceof Error)
})

test('GitHubError has correct error code', (t) => {
  const one = new github.GitHubError('testing')

  t.is(one.code, 'GTHERR')
})
