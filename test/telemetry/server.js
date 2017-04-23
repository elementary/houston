/**
 * test/telemetry/server.js
 * Tests Telemetry server functions
 */

import mock from 'mock-require'
import moment from 'moment'
import path from 'path'
import test from 'ava'

import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'

mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

import * as telemetry from 'telemetry/server'
import config from 'lib/config'
import db from 'lib/database/connection'
import Download from 'lib/database/download'
import Project from 'lib/database/project'

test.before((t) => {
  db.connect(config.database)
})

test.after((t) => {
  db.connection.close()
})

test('parseMessage can parse a nginx message string', (t) => {
  const parseMessage = telemetry.parseMessage

  const one = parseMessage('192.168.1.1|OK|/apphub/dists/xenial/main/appstream/Components-amd64.yml.gz|163|chrome|128')

  t.is(one.client, '192.168.1.1')
  t.is(one.status, 'OK')
  t.is(one.path, '/apphub/dists/xenial/main/appstream/Components-amd64.yml.gz')
  t.is(one.file, 'Components-amd64.yml.gz')
  t.is(one.ext, '.gz')
  t.is(one.bytes, 163)
  t.is(one.time, 128)
})

test('increments download number for release', async (t) => {
  await Project.remove({ 'name.domain': 'com.github.elementary.houston' })

  const project = new Project({
    name: {
      domain: 'com.github.elementary.houston'
    },
    repository: {
      url: 'https://github.com/elementary/houston.git'
    },
    releases: [{
      version: '0.0.1',
      changelog: ['testing release'],
      'github.id': 1,
      'github.author': 'btkostner',
      'github.date': new Date(),
      'github.tag': 'v0.0.1'
    }]
  })

  await project.save()

  const msg = '192.168.1.1|OK|/houston/pool/main/c/com.github.elementary.houston/com.github.elementary.houston_0.0.1_amd64.deb|163|chrome|128'

  await telemetry.handleMessage({ msg })

  const downloads = await Download.find({ release: project.releases[0]._id })

  t.is(downloads.length, 4)

  const year = downloads.find((download) => (download.type === 'year'))

  t.not(year, null)
  t.is(year.year[moment.utc().get('year')], 1)
})
