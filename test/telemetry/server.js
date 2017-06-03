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

const config = require(path.resolve(alias.resolve.alias['lib'], 'config')).default
const db = require(path.resolve(alias.resolve.alias['lib'], 'database', 'connection.js')).default
const Download = require(path.resolve(alias.resolve.alias['lib'], 'database', 'download')).default
const Project = require(path.resolve(alias.resolve.alias['lib'], 'database', 'project')).default
const telemetry = require(path.resolve(alias.resolve.alias['telemetry'], 'server'))

test.before((t) => {
  db.connect(config.database)
})

test.after((t) => {
  db.connection.close()
})

test('parseMessage can parse a nginx message string', (t) => {
  const parseMessage = telemetry.parseMessage

  const one = parseMessage('test nginx: 192.168.1.1|200|/apphub/dists/xenial/main/appstream/Components-amd64.yml.gz|163|chrome|128')

  t.is(one.client, '192.168.1.1')
  t.is(one.status, 200)
  t.is(one.path, '/apphub/dists/xenial/main/appstream/Components-amd64.yml.gz')
  t.is(one.file, 'Components-amd64.yml.gz')
  t.is(one.ext, '.gz')
  t.is(one.bytes, 163)
  t.is(one.time, 128)
})

test('increments download number for release', async (t) => {
  await Project.remove({ name: 'com.github.elementary.houston' })

  const project = await Project.create({
    name: 'com.github.elementary.houston',
    repo: 'https://github.com/elementary/houston.git',
    releases: [{
      version: '0.0.1',
      changelog: ['testing release'],
      'github.id': 1,
      'github.author': 'btkostner',
      'github.date': new Date(),
      'github.tag': 'v0.0.1'
    }]
  })

  const msg = 'test nginx: 192.168.1.1|200|/houston/pool/main/c/com.github.elementary.houston/com.github.elementary.houston_0.0.1_amd64.deb|163|chrome|128'

  const buf = Buffer.from(msg, 'utf8')
  await telemetry.handleMessage(buf)

  const downloads = await Download.find({ release: project.releases[0]._id })

  t.is(downloads.length, 4)

  const year = downloads.find((download) => (download.type === 'year'))

  t.not(year, null)
  t.is(year.year[moment.utc().get('year')], 1)
})
