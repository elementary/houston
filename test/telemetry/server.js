/**
 * test/telemetry/server.js
 * Tests Telemetry server functions
 */

import mock from 'mock-require'
import path from 'path'
import test from 'ava'

import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'

test.beforeEach((t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

  t.context.telemetry = require(path.resolve(alias.resolve.alias['telemetry'], 'server'))
  t.context.Project = require(path.resolve(alias.resolve.alias['lib'], 'database', 'project')).default
})

test('parseMessage can parse a nginx message string', (t) => {
  const parseMessage = t.context.telemetry.parseMessage

  const one = parseMessage('192.168.1.1|OK|/apphub/dists/xenial/main/appstream/Components-amd64.yml.gz|163|chrome|128')

  t.is(one.client, '192.168.1.1')
  t.is(one.status, 'OK')
  t.is(one.path, '/apphub/dists/xenial/main/appstream/Components-amd64.yml.gz')
  t.is(one.file, 'Components-amd64.yml.gz')
  t.is(one.ext, '.gz')
  t.is(one.bytes, 163)
  t.is(one.time, 128)
})

// eslint-disable-next-line
test.todo('handleMessage increments download count for project')
