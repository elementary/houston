/**
 * test/service/fixtures/github.js
 * A monolithic file of all things raw GitHub response
 *
 * @exports {Object} header - basic GitHub headers
 * @exports {Function} mockRepo - Mocks a repo object
 * @exports {Object} repo - a single GitHub repo response
 * @exports {Object[]} repos - four repo objects in an array
 * @exports {Object} release - a single GitHub release
 * @exports {Object[]} releases - four release objects in an array
 */

import _ from 'lodash'

/**
 * header
 * Basic GitHub server headers for use in mocking
 */
export const header = {
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
  'cache-control': 'public, max-age=60, s-maxage=60',
  'connection': 'close',
  'content-security-policy': 'default-src \'none\'',
  'content-type': 'application/json; charset=utf-8',
  'etag': '"a8e448a94v8w198bvw4e846efwefxd34"',
  'server': 'GitHub.com',
  'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
  'vary': 'Accept, Accept-Encoding',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'deny',
  'x-github-media-type': 'github.machine-man-preview; format=json',
  'x-github-request-id': '12457896:7384:4857186:94875132',
  'x-served-by': 'w498ve4q56189w48e9g4s5a6d41189wf',
  'x-xss-protection': '1; mode=block'
}

/**
 * mockRepo
 * Mocks a repo so you don't have to repeat things like url creation
 *
 * @param {Object} def - default values for a repo
 * @return {Object} - a mocked GitHub repository object
 */
export function mockRepo (def = {}) {
  const name = (def.name != null) ? def.name : 'test'
  const owner = (def.owner != null && def.owner.login != null) ? def.owner.login : 'elementary'

  return _.merge({
    'id': 1,
    'owner': {
      'login': owner,
      'id': 1,
      'avatar_url': `https://github.com/images/error/${owner}_happy.gif`,
      'gravatar_id': '',
      'url': `https://api.github.com/users/${owner}`,
      'html_url': `https://github.com/${owner}`,
      'followers_url': `https://api.github.com/users/${owner}/followers`,
      'following_url': `https://api.github.com/users/${owner}/following{/other_user}`,
      'gists_url': `https://api.github.com/users/${owner}/gists{/gist_id}`,
      'starred_url': `https://api.github.com/users/${owner}/starred{/owner}{/repo}`,
      'subscriptions_url': `https://api.github.com/users/${owner}/subscriptions`,
      'organizations_url': `https://api.github.com/users/${owner}/orgs`,
      'repos_url': `https://api.github.com/users/${owner}/repos`,
      'events_url': `https://api.github.com/users/${owner}/events{/privacy}`,
      'received_events_url': `https://api.github.com/users/${owner}/received_events`,
      'type': 'User',
      'site_admin': false
    },
    name,
    'full_name': `${owner}/${name}`,
    'description': 'This your first repo!',
    'private': false,
    'fork': false,
    'url': `https://api.github.com/repos/${owner}/${name}`,
    'html_url': `https://github.com/${owner}/${name}`,
    'archive_url': `http://api.github.com/repos/${owner}/${name}/{archive_format}{/ref}`,
    'assignees_url': `http://api.github.com/repos/${owner}/${name}/assignees{/user}`,
    'blobs_url': `http://api.github.com/repos/${owner}/${name}/git/blobs{/sha}`,
    'branches_url': `http://api.github.com/repos/${owner}/${name}/branches{/branch}`,
    'clone_url': `https://github.com/${owner}/${name}.git`,
    'collaborators_url': `http://api.github.com/repos/${owner}/${name}/collaborators{/collaborator}`,
    'comments_url': `http://api.github.com/repos/${owner}/${name}/comments{/number}`,
    'commits_url': `http://api.github.com/repos/${owner}/${name}/commits{/sha}`,
    'compare_url': `http://api.github.com/repos/${owner}/${name}/compare/{base}...{head}`,
    'contents_url': `http://api.github.com/repos/${owner}/${name}/contents/{+path}`,
    'contributors_url': `http://api.github.com/repos/${owner}/${name}/contributors`,
    'deployments_url': `http://api.github.com/repos/${owner}/${name}/deployments`,
    'downloads_url': `http://api.github.com/repos/${owner}/${name}/downloads`,
    'events_url': `http://api.github.com/repos/${owner}/${name}/events`,
    'forks_url': `http://api.github.com/repos/${owner}/${name}/forks`,
    'git_commits_url': `http://api.github.com/repos/${owner}/${name}/git/commits{/sha}`,
    'git_refs_url': `http://api.github.com/repos/${owner}/${name}/git/refs{/sha}`,
    'git_tags_url': `http://api.github.com/repos/${owner}/${name}/git/tags{/sha}`,
    'git_url': `git:github.com/${owner}/${name}.git`,
    'hooks_url': `http://api.github.com/repos/${owner}/${name}/hooks`,
    'issue_comment_url': `http://api.github.com/repos/${owner}/${name}/issues/comments{/number}`,
    'issue_events_url': `http://api.github.com/repos/${owner}/${name}/issues/events{/number}`,
    'issues_url': `http://api.github.com/repos/${owner}/${name}/issues{/number}`,
    'keys_url': `http://api.github.com/repos/${owner}/${name}/keys{/key_id}`,
    'labels_url': `http://api.github.com/repos/${owner}/${name}/labels{/name}`,
    'languages_url': `http://api.github.com/repos/${owner}/${name}/languages`,
    'merges_url': `http://api.github.com/repos/${owner}/${name}/merges`,
    'milestones_url': `http://api.github.com/repos/${owner}/${name}/milestones{/number}`,
    'mirror_url': `git:git.example.com/${owner}/${name}`,
    'notifications_url': `http://api.github.com/repos/${owner}/${name}/notifications{?since, all, participating}`,
    'pulls_url': `http://api.github.com/repos/${owner}/${name}/pulls{/number}`,
    'releases_url': `http://api.github.com/repos/${owner}/${name}/releases{/id}`,
    'ssh_url': `git@github.com:${owner}/${name}.git`,
    'stargazers_url': `http://api.github.com/repos/${owner}/${name}/stargazers`,
    'statuses_url': `http://api.github.com/repos/${owner}/${name}/statuses/{sha}`,
    'subscribers_url': `http://api.github.com/repos/${owner}/${name}/subscribers`,
    'subscription_url': `http://api.github.com/repos/${owner}/${name}/subscription`,
    'svn_url': `https://svn.github.com/${owner}/${name}`,
    'tags_url': `http://api.github.com/repos/${owner}/${name}/tags`,
    'teams_url': `http://api.github.com/repos/${owner}/${name}/teams`,
    'trees_url': `http://api.github.com/repos/${owner}/${name}/git/trees{/sha}`,
    'homepage': `https://github.com`,
    'language': null,
    'forks_count': 9,
    'stargazers_count': 80,
    'watchers_count': 80,
    'size': 108,
    'default_branch': 'master',
    'open_issues_count': 0,
    'has_issues': true,
    'has_wiki': true,
    'has_pages': false,
    'has_downloads': true,
    'pushed_at': '2011-01-26T19:06:43Z',
    'created_at': '2011-01-26T19:01:12Z',
    'updated_at': '2011-01-26T19:14:43Z',
    'permissions': {
      'admin': false,
      'push': false,
      'pull': true
    }
  }, def)
}

/**
 * mockRelease
 * Mocks a release for sanity and other nice things
 *
 * @param {Object} def - default values for a release
 * @return {Object} - a mocked GitHub release object
 */
export function mockRelease (def = {}) {
  const name = (def.name != null) ? def.name : 'test'
  const owner = (def.owner != null && def.owner.login != null) ? def.owner.login : 'elementary'
  const tag = (def.tag_name != null) ? def.tag_name : 'v1.0.0'
  const id = (def.id != null) ? def.id : 1

  return _.merge({
    'url': `https://api.github.com/repos/${owner}/${name}/releases/${id}`,
    'html_url': `https://github.com/${owner}/${name}/releases/${tag}`,
    'assets_url': `https://api.github.com/repos/${owner}/${name}/releases/${id}/assets`,
    'upload_url': `https://uploads.github.com/repos/${owner}/${name}/releases/${id}/assets{?name,label}`,
    'tarball_url': `https://api.github.com/repos/${owner}/${name}/tarball/${tag}`,
    'zipball_url': `https://api.github.com/repos/${owner}/${name}/zipball/${tag}`,
    id,
    'tag_name': tag,
    'target_commitish': 'master',
    'name': tag,
    'body': 'Description of the release',
    'draft': false,
    'prerelease': false,
    'created_at': '2013-02-27T19:35:32Z',
    'published_at': '2013-02-27T19:35:32Z',
    'author': {
      'login': owner,
      'id': 1,
      'avatar_url': `https://github.com/images/error/${owner}_happy.gif`,
      'gravatar_id': '',
      'url': `https://api.github.com/users/${owner}`,
      'html_url': `https://github.com/${owner}`,
      'followers_url': `https://api.github.com/users/${owner}/followers`,
      'following_url': `https://api.github.com/users/${owner}/following{/other_user}`,
      'gists_url': `https://api.github.com/users/${owner}/gists{/gist_id}`,
      'starred_url': `https://api.github.com/users/${owner}/starred{/owner}{/repo}`,
      'subscriptions_url': `https://api.github.com/users/${owner}/subscriptions`,
      'organizations_url': `https://api.github.com/users/${owner}/orgs`,
      'repos_url': `https://api.github.com/users/${owner}/repos`,
      'events_url': `https://api.github.com/users/${owner}/events{/privacy}`,
      'received_events_url': `https://api.github.com/users/${owner}/received_events`,
      'type': 'User',
      'site_admin': false
    },
    'assets': [
      {
        'url': `https://api.github.com/repos/${owner}/${name}/releases/assets/1`,
        'browser_download_url': `https://github.com/${owner}/${name}/releases/download/${tag}/example.zip`,
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
          'login': owner,
          'id': 1,
          'avatar_url': `https://github.com/images/error/${owner}_happy.gif`,
          'gravatar_id': '',
          'url': `https://api.github.com/users/${owner}`,
          'html_url': `https://github.com/${owner}`,
          'followers_url': `https://api.github.com/users/${owner}/followers`,
          'following_url': `https://api.github.com/users/${owner}/following{/other_user}`,
          'gists_url': `https://api.github.com/users/${owner}/gists{/gist_id}`,
          'starred_url': `https://api.github.com/users/${owner}/starred{/owner}{/repo}`,
          'subscriptions_url': `https://api.github.com/users/${owner}/subscriptions`,
          'organizations_url': `https://api.github.com/users/${owner}/orgs`,
          'repos_url': `https://api.github.com/users/${owner}/repos`,
          'events_url': `https://api.github.com/users/${owner}/events{/privacy}`,
          'received_events_url': `https://api.github.com/users/${owner}/received_events`,
          'type': 'User',
          'site_admin': false
        }
      }
    ]
  }, def)
}

export const repo = mockRepo({ name: 'test', owner: { login: 'elementary' } })

export const repos = [
  mockRepo({ name: 'test1', owner: { login: 'elementary' } }),
  mockRepo({ name: 'test2', owner: { login: 'elementary' } }),
  mockRepo({ name: 'test3', owner: { login: 'elementary' } }),
  mockRepo({ name: 'test4', owner: { login: 'elementary' } })
]

export const release = mockRelease({ name: 'test', owner: { login: 'elementary' } })

export const releases = [
  mockRelease({ id: 1, name: 'test1', tag_name: 'v1.0.0', owner: { login: 'elementary' } }),
  mockRelease({ id: 2, name: 'test2', tag_name: 'v1.2.0', owner: { login: 'elementary' } }),
  mockRelease({ id: 3, name: 'test3', tag_name: 'v1.2.5', owner: { login: 'elementary' } }),
  mockRelease({ id: 4, name: 'test4', tag_name: 'v2.0.0', owner: { login: 'elementary' } })
]
