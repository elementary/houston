/**
 * test/service/aptly.js
 * Tests Aptly API functinos
 */

import _ from 'lodash'
import mock from 'mock-require'
import nock from 'nock'
import path from 'path'
import test from 'ava'

import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'

// Manually enable GitHub posting
const override = {
  aptly: {
    url: 'http://localhost:4321',
    passphrase: 'testingpassphrase',
    review: 'testing',
    stable: 'stable'
  }
}

test.before((t) => {
  // This will capture any incoming data and put it to a file.
  // Use it for verifying we are testing real data.
  // Make sure to enable net connect and disable the tests you don't want
  // to run with `test.skip()`!
  // nock.recorder.rec({
  //   logging: (context) => fs.appendFile('github.log', context)
  // })

  nock.disableNetConnect() // Disables all real HTTP requests
})

test.beforeEach((t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), _.merge(mockConfig, override))

  t.context.config = require(path.resolve(alias.resolve.alias['lib'], 'config')).default
  t.context.aptly = require(path.resolve(alias.resolve.alias['service'], 'aptly'))

  // A note to the smart people. Don't use nock cleanAll() here.
})

test('Can delete files', async (t) => {
  const aptly = t.context.aptly

  nock('http://localhost:4321', { encodedQueryparams: true })
  .replyContentLength()
  .replyDate()
  .delete('/files/test/file.txt')
  .reply(200, {})

  const one = await aptly.del('test/file.txt')

  t.is(typeof one, 'object')
})

test('Can add files', async (t) => {
  const aptly = t.context.aptly

  nock('http://localhost:4321', { encodedQueryparams: true })
  .replyContentLength()
  .replyDate()
  .post('/repos/stable/packages', {
    PackageRefs: ['test']
  })
  .reply(200, {
    Name: 'stable',
    Comment: 'a testing repository',
    DefaultDistribution: '',
    DefaultComponent: 'main'
  })

  const one = await aptly.add('stable', ['test'])

  t.is(typeof one, 'object')
  t.is(one.Name, 'stable')
})

test('Can remove files', async (t) => {
  const aptly = t.context.aptly

  nock('http://localhost:4321', { encodedQueryparams: true })
  .replyContentLength()
  .replyDate()
  .delete('/repos/stable/packages', {
    PackageRefs: ['test']
  })
  .reply(200, {
    Name: 'stable',
    Comment: 'a testing repository',
    DefaultDistribution: '',
    DefaultComponent: 'main'
  })

  const one = await aptly.remove('stable', ['test'])

  t.is(typeof one, 'object')
  t.is(one.Name, 'stable')
})

test('Can move files', async (t) => {
  const aptly = t.context.aptly

  nock('http://localhost:4321', { encodedQueryparams: true })
  .replyContentLength()
  .replyDate()
  .post('/repos/stable/packages', {
    PackageRefs: ['test']
  })
  .reply(200, {
    Name: 'stable',
    Comment: 'a testing repository',
    DefaultDistribution: '',
    DefaultComponent: 'main'
  })

  nock('http://localhost:4321', { encodedQueryparams: true })
  .replyContentLength()
  .replyDate()
  .delete('/repos/review/packages', {
    PackageRefs: ['test']
  })
  .reply(200, {
    Name: 'review',
    Comment: 'a testing repository',
    DefaultDistribution: '',
    DefaultComponent: 'main'
  })

  await aptly.move('review', 'stable', ['test'])
})

test('Can snapshot repositories', async (t) => {
  const aptly = t.context.aptly

  nock('http://localhost:4321', { encodedQueryparams: true })
  .replyContentLength()
  .replyDate()
  .post('/repos/stable/snapshots', (body) => {
    if (body.Name == null) return false
    if (body.Description !== 'Automated Houston publish') return false
    return true
  })
  .reply(200, {
    Name: 'test',
    CreatedAt: '2015-02-28T19:56:59.137192613+03:00',
    Description: 'Automated Houston publish'
  })

  const one = await aptly.snapshot('stable')

  t.is(one, 'test')
})

test('Can publish repositories', async (t) => {
  const aptly = t.context.aptly

  nock('http://localhost:4321', { encodedQueryparams: true })
  .replyContentLength()
  .replyDate()
  .post('/repos/stable/snapshots', (body) => {
    if (body.Name == null) return false
    if (body.Description !== 'Automated Houston publish') return false
    return true
  })
  .reply(200, {
    Name: 'test',
    CreatedAt: '2015-02-28T19:56:59.137192613+03:00',
    Description: 'Automated Houston publish'
  })

  nock('http://localhost:4321', { encodedQueryparams: true })
  .replyContentLength()
  .replyDate()
  .put('/publish/stable/xenial', (body) => {
    if (body.Snapshots[0].Component !== 'main') return false
    if (body.Snapshots[0].Name !== 'test') return false

    if (body.Signing.Batch !== true) return false
    if (body.Signing.Passphrase !== t.context.config.aptly.passphrase) return false

    return true
  })
  .reply(200, {
    Name: 'test',
    CreatedAt: '2015-02-28T19:56:59.137192613+03:00',
    Description: 'Automated Houston publish'
  })

  const one = await aptly.publish('stable')

  t.is(one, 'test')
})
