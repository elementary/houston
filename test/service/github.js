/**
 * test/service/github.js
 * Tests GitHub third party functions
 */

import _ from 'lodash'
import fs from 'fs'
import jwt from 'jsonwebtoken'
import mock from 'mock-require'
import moment from 'moment'
import nock from 'nock'
import path from 'path'
import test from 'ava'

import { user as mockedUser } from 'test/lib/database/fixtures/user'
import * as fixture from './fixtures/github'
import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'

const publicKey = path.resolve(alias.resolve.alias['test'], 'fixtures', 'github', 'public.pem')

// Manually enable GitHub posting
const override = {
  github: {
    post: true
  }
}

mock(path.resolve(alias.resolve.alias['root'], 'config.js'), _.merge(mockConfig, override))

const config = require(path.resolve(alias.resolve.alias['lib'], 'config')).default
const db = require(path.resolve(alias.resolve.alias['lib'], 'database', 'connection.js')).default
const User = require(path.resolve(alias.resolve.alias['lib'], 'database', 'user')).default
const github = require(path.resolve(alias.resolve.alias['service'], 'github'))

test.before((t) => {
  // This will capture any incoming data and put it to a file.
  // Use it for verifying we are testing real data.
  // Make sure to enable net connect and disable the tests you don't want
  // to run with `test.skip()`!
  // nock.recorder.rec({
  //   logging: (context) => fs.appendFile('github.log', context)
  // })

  nock.disableNetConnect() // Disables all real HTTP requests
  db.connect(config.database)
})

test.after((t) => {
  db.connection.close()
})

test('Can generate an accurate JWT', async (t) => {
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

test('Can generate an accurate token', async (t) => {
  nock('https://api.github.com:443', { encodedQueryparams: true })
    .matchHeader('Accept', 'application/vnd.github.machine-man-preview+json')
    .replyContentLength()
    .replyDate()
    .post('/installations/1/access_tokens')
    .reply(201, {
      token: 'v1.48b9a4we891aw9f9a4bv8we9a165hj4r89tjsdfh',
      'expires_at': '2016-09-23T21:26:26Z',
      'on_behalf_of': null
    }, fixture.header)

  const one = await github.generateToken(1)

  t.is(one, 'v1.48b9a4we891aw9f9a4bv8we9a165hj4r89tjsdfh')
})

test('Uses token cache', async (t) => {
  // NOTE: we only mock each endpoint ONCE. if you get to this point due to an
  // 'Unable to generate authentication token' it's most likely because the
  // cache failed and we are trying to connect to GitHub again.
  nock('https://api.github.com:443', { encodedQueryparams: true })
    .matchHeader('Accept', 'application/vnd.github.machine-man-preview+json')
    .replyContentLength()
    .replyDate()
    .post('/installations/1/access_tokens')
    .reply(201, {
      token: 'v1.48b9a4we891aw9f9a4bv8we9a165hj4r89tjsdfh',
      'expires_at': moment().add(1, 'hours').toISOString(),
      'on_behalf_of': null
    }, fixture.header)

  nock('https://api.github.com:443', { encodedQueryparams: true })
    .matchHeader('Accept', 'application/vnd.github.machine-man-preview+json')
    .replyContentLength()
    .replyDate()
    .post('/installations/2/access_tokens')
    .reply(201, {
      token: 'v1.afj9830jf0a293jf0aj30f9jaw30f9jaw039fj0a',
      'expires_at': moment().add(1, 'hours').toISOString(),
      'on_behalf_of': null
    }, fixture.header)

  const one = await github.generateToken(1)
  const two = await github.generateToken(2)

  t.is(one, 'v1.48b9a4we891aw9f9a4bv8we9a165hj4r89tjsdfh')
  t.is(two, 'v1.afj9830jf0a293jf0aj30f9jaw30f9jaw039fj0a')

  t.throws(github.generateToken(3))

  // Due to async nature we timeout to prevent a race condition
  setTimeout(async () => {
    const three = await github.generateToken(1)
    const four = await github.generateToken(2)

    t.is(one, three)
    t.is(two, four)
  }, 1000)
})

test('Can get single repo', async (t) => {
  nock('https://api.github.com:443', { encodedQueryparams: true })
    .matchHeader('Accept', 'application/vnd.github.machine-man-preview+json')
    .replyContentLength()
    .replyDate()
    .get('/repos/elementary/test')
    .reply(200, fixture.repo, fixture.header)

  const one = await github.getRepo('elementary', 'test')

  t.is(typeof one, 'object')
  t.is(one.name, 'com.github.elementary.test')
})

test('Can get list of repos for user', async (t) => {
  nock('https://api.github.com:443', { encodedQueryparams: true })
    .matchHeader('Accept', 'application/vnd.github.machine-man-preview+json')
    .replyContentLength()
    .replyDate()
    .get('/user/repos')
    .query({ sort: 'pushed', page: 1 })
    .reply(200, fixture.repos, fixture.header)

  const user = await User.create(mockedUser)
  const one = await github.getReposForUser(user)

  t.is(typeof one, 'object')
  t.is(one[0].name, 'com.github.elementary.test1')
  t.is(one[0].repo, 'https://github.com/elementary/test1.git')
  t.is(one[0].github.id, 1)
  t.is(typeof one[0].github.integration, 'undefined')
})

test('getReposForUser updates user cache', async (t) => {
  nock('https://api.github.com:443', { encodedQueryparams: true })
    .matchHeader('Accept', 'application/vnd.github.machine-man-preview+json')
    .replyContentLength()
    .replyDate()
    .get('/user/repos')
    .query({ sort: 'pushed', page: 1 })
    .reply(200, fixture.repos, fixture.header)

  const user = await User.create(mockedUser)
  const one = await github.getReposForUser(user)
  const updatedUser = await User.findById(user._id)

  t.not(updatedUser.github.cache, user.github.cache)
  t.is(updatedUser.github.projects.length, one.length)
})

test('getReposForUser uses user cache of projects', async (t) => {
  nock('https://api.github.com:443', { encodedQueryparams: true })
    .matchHeader('Accept', 'application/vnd.github.machine-man-preview+json')
    .replyContentLength()
    .replyDate()
    .get('/user/repos')
    .query({ sort: 'pushed', page: 1 })
    .reply(200, fixture.repos, fixture.header)

  const user = await User.create(mockedUser)

  const one = await github.getReposForUser(user)
  const two = await User.findById(user._id)

  t.not(two.github.cache, user.github.cache)
  t.is(two.github.projects.length, one.length)

  const four = await User.findById(user._id)

  t.deepEqual(four.github.cache, two.github.cache)
})

test('Can get list of releases', async (t) => {
  nock('https://api.github.com:443', { encodedQueryparams: true })
    .matchHeader('Accept', 'application/vnd.github.machine-man-preview+json')
    .replyContentLength()
    .replyDate()
    .get('/repos/elementary/test1/releases')
    .query({ page: 1 })
    .reply(200, fixture.releases, fixture.header)

  const one = await github.getReleases('elementary', 'test1')

  t.is(typeof one, 'object')
  t.is(one[0].version, '1.0.0')
  t.is(one[0].github.id, 1)
  t.true(one[0].date.released instanceof Date)
})

test('Can get a release by way of tag', async (t) => {
  nock('https://api.github.com:443', { encodedQueryparams: true })
    .matchHeader('Accept', 'application/vnd.github.machine-man-preview+json')
    .replyContentLength()
    .replyDate()
    .get('/repos/elementary/test1/releases/tags/v1.0.0')
    .reply(200, fixture.release, fixture.header)

  const one = await github.getReleaseByTag('elementary', 'test1', 'v1.0.0')

  t.is(typeof one, 'object')
  t.is(one.version, '1.0.0')
  t.is(one.github.id, 1)
  t.true(one.date.released instanceof Date)
})

test('Can get accurate permissions', async (t) => {
  nock('https://api.github.com:443', { encodedQueryParams: true })
    .matchHeader('Accept', 'application/vnd.github.machine-man-preview+json')
    .replyContentLength()
    .replyDate()
    .get('/repos/elementary/test/collaborators/test1')
    .reply(204, null, fixture.header)

  nock('https://api.github.com:443', { encodedQueryParams: true })
    .matchHeader('Accept', 'application/vnd.github.machine-man-preview+json')
    .replyContentLength()
    .replyDate()
    .get('/repos/elementary/test/collaborators/test2')
    .reply(404, null, fixture.header)

  const one = await github.getPermission('elementary', 'test', 'test1')
  const two = await github.getPermission('elementary', 'test', 'test2')
  const three = await github.getPermission('elementary', 'test', 'test3')

  t.true(one)
  t.false(two)
  t.false(three)
})

test('Can get a single label', async (t) => {
  nock('https://api.github.com:443', { encodedQueryparams: true })
    .matchHeader('Accept', 'application/vnd.github.machine-man-preview+json')
    .replyContentLength()
    .replyDate()
    .get('/repos/elementary/test/labels/test1')
    .reply(200, {
      'url': 'https://api.github.com/repos/elementary/test/labels/test1',
      'name': 'test1',
      'color': 'f29513'
    }, fixture.header)

  const one = await github.getLabel('elementary', 'test', 'test1', 'testToken')

  t.is(typeof one, 'object')
  t.is(one.name, 'test1')
})

test('Can get release assets', async (t) => {
  nock('https://api.github.com:443', { encodedQueryparams: true })
    .matchHeader('Accept', 'application/vnd.github.machine-man-preview+json')
    .replyContentLength()
    .replyDate()
    .get('/repos/elementary/test1/releases/1/assets')
    .reply(200, [{
      'url': 'https://api.github.com/repos/elementary/test1/releases/assets/1',
      'browser_download_url': 'https://github.com/elementary/test1/releases/download/v1.0.0/example.zip',
      'id': 1,
      'name': 'example.zip',
      'label': 'short description',
      'state': 'uploaded',
      'content_type': 'application/zip',
      'size': 1024,
      'download_count': 42,
      'created_at': '2013-02-27T19:35:32Z',
      'updated_at': '2013-02-27T19:35:32Z',
      'uploader': {
        'login': 'octocat',
        'id': 1,
        'avatar_url': 'https://github.com/images/error/octocat_happy.gif',
        'gravatar_id': '',
        'url': 'https://api.github.com/users/octocat',
        'html_url': 'https://github.com/octocat',
        'followers_url': 'https://api.github.com/users/octocat/followers',
        'following_url': 'https://api.github.com/users/octocat/following{/other_user}',
        'gists_url': 'https://api.github.com/users/octocat/gists{/gist_id}',
        'starred_url': 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
        'subscriptions_url': 'https://api.github.com/users/octocat/subscriptions',
        'organizations_url': 'https://api.github.com/users/octocat/orgs',
        'repos_url': 'https://api.github.com/users/octocat/repos',
        'events_url': 'https://api.github.com/users/octocat/events{/privacy}',
        'received_events_url': 'https://api.github.com/users/octocat/received_events',
        'type': 'User',
        'site_admin': false
      }
    }], fixture.header)

  const one = await github.getAssets('elementary', 'test1', 1)

  t.is(typeof one, 'object')
  t.is(one[0].id, 1)
  t.is(one[0].size, 1024)
})

test('Can post a label', async (t) => {
  nock('https://api.github.com:443', { encodedQueryParams: true })
    .matchHeader('Accept', 'application/vnd.github.machine-man-preview+json')
    .matchHeader('Authorization', 'token testToken')
    .replyContentLength()
    .replyDate()
    .post('/repos/elementary/test1/labels', {
      'name': 'test1',
      'color': 'f29513'
    })
    .reply(201, {
      'url': 'https://api.github.com/repos/btkostner/vocal/labels/test1',
      'name': 'test1',
      'color': 'f29513'
    }, fixture.header)

  const one = await github.postLabel('elementary', 'test1', 'testToken', {
    'name': 'test1',
    'color': 'f29513'
  })

  t.is(typeof one, 'object')
  t.is(one.name, 'test1')
  t.is(one.color, 'f29513')
})

test('Can post an issue', async (t) => {
  nock('https://api.github.com:443', { encodedQueryparams: true })
    .matchHeader('Accept', 'application/vnd.github.machine-man-preview+json')
    .matchHeader('Authorization', 'token testToken')
    .replyContentLength()
    .replyDate()
    .post('/repos/elementary/test1/issues', {
      'title': 'test1',
      'body': 'test1',
      'label': ['test1']
    })
    .reply(201, {
      'id': 1,
      'url': 'https://api.github.com/repos/elemenetary/test1/issues/1347',
      'repository_url': 'https://api.github.com/repos/elemenetary/test1',
      'labels_url': 'https://api.github.com/repos/elemenetary/test1/issues/1347/labels{/name}',
      'comments_url': 'https://api.github.com/repos/elemenetary/test1/issues/1347/comments',
      'events_url': 'https://api.github.com/repos/elemenetary/test1/issues/1347/events',
      'html_url': 'https://github.com/elemenetary/test1/issues/1347',
      'number': 1,
      'state': 'open',
      'title': 'test1',
      'body': 'test1',
      'user': {
        'login': 'elemenetary',
        'id': 1,
        'avatar_url': 'https://github.com/images/error/elemenetary_happy.gif',
        'gravatar_id': '',
        'url': 'https://api.github.com/users/elemenetary',
        'html_url': 'https://github.com/elemenetary',
        'followers_url': 'https://api.github.com/users/elemenetary/followers',
        'following_url': 'https://api.github.com/users/elemenetary/following{/other_user}',
        'gists_url': 'https://api.github.com/users/elemenetary/gists{/gist_id}',
        'starred_url': 'https://api.github.com/users/elemenetary/starred{/owner}{/repo}',
        'subscriptions_url': 'https://api.github.com/users/elemenetary/subscriptions',
        'organizations_url': 'https://api.github.com/users/elemenetary/orgs',
        'repos_url': 'https://api.github.com/users/elemenetary/repos',
        'events_url': 'https://api.github.com/users/elemenetary/events{/privacy}',
        'received_events_url': 'https://api.github.com/users/elemenetary/received_events',
        'type': 'User',
        'site_admin': false
      },
      'labels': [
        {
          'url': 'https://api.github.com/repos/elemenetary/test1/labels/bug',
          'name': 'test1',
          'color': 'f29513'
        }
      ],
      'locked': false,
      'comments': 0,
      'closed_at': null,
      'created_at': '2011-04-22T13:33:48Z',
      'updated_at': '2011-04-22T13:33:48Z'
    }, fixture.header)

  const one = await github.postIssue('elementary', 'test1', 'testToken', {
    'title': 'test1',
    'body': 'test1',
    'label': ['test1']
  })

  t.is(one, 1)
})

test('Can post a file', async (t) => {
  nock('https://uploads.github.com:443', { encodedQueryparams: true })
    .matchHeader('Accept', 'application/vnd.github.machine-man-preview+json')
    .matchHeader('Authorization', 'token testToken')
    .replyContentLength()
    .replyDate()
    .post('/repos/elementary/test1/releases/1/assets')
    .query({
      name: 'config.js',
      label: 'config'
    })
    .reply(201, {
      'url': 'https://api.github.com/repos/elementary/test1/releases/assets/1',
      'browser_download_url': 'https://github.com/elementary/test1/releases/download/v1.0.0/example.zip',
      'id': 1,
      'name': 'config.js',
      'label': 'config',
      'state': 'uploaded',
      'content_type': 'application/javascript',
      'size': 1024,
      'download_count': 42,
      'created_at': '2013-02-27T19:35:32Z',
      'updated_at': '2013-02-27T19:35:32Z',
      'uploader': {
        'login': 'elementary',
        'id': 1,
        'avatar_url': 'https://github.com/images/error/elementary_happy.gif',
        'gravatar_id': '',
        'url': 'https://api.github.com/users/elementary',
        'html_url': 'https://github.com/elementary',
        'followers_url': 'https://api.github.com/users/elementary/followers',
        'following_url': 'https://api.github.com/users/elementary/following{/other_user}',
        'gists_url': 'https://api.github.com/users/elementary/gists{/gist_id}',
        'starred_url': 'https://api.github.com/users/elementary/starred{/owner}{/repo}',
        'subscriptions_url': 'https://api.github.com/users/elementary/subscriptions',
        'organizations_url': 'https://api.github.com/users/elementary/orgs',
        'repos_url': 'https://api.github.com/users/elementary/repos',
        'events_url': 'https://api.github.com/users/elementary/events{/privacy}',
        'received_events_url': 'https://api.github.com/users/elementary/received_events',
        'type': 'User',
        'site_admin': false
      }
    }, fixture.header)

  const one = await github.postFile('elementary', 'test1', 1, 'testToken', {
    'name': 'config.js',
    'label': 'config',
    'path': path.resolve(alias.resolve.alias['test'], 'fixtures', 'config.js')
  })

  t.is(one, 1)
})
