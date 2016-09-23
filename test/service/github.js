/**
 * test/service/github.js
 * Tests GitHub third party functions
 */

import test from 'ava'
import mock from 'mock-require'
import path from 'path'

import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'

test.beforeEach((t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config'), mockConfig)

  t.context.github = require(path.resolve(alias.resolve.alias['service'], 'github'))
})

test('GitHubError is an error', (t) => {
  const github = t.context.github

  const one = new github.GitHubError('testing')

  t.true(one instanceof Error)
})

test('GitHubError has correct error code', (t) => {
  const github = t.context.github

  const one = new github.GitHubError('testing')

  t.is(one.code, 'GTHERR')
})
