/**
 * test/service/helpers/github.js
 * Holds various helper functions to make the github service test file smaller
 *
 * @exports {Function} mock - mocks a GitHub request
 */

import nock from 'nock'

/**
 * mock
 * Mocks a GitHub request
 * NOTE: We don't test header information, but it's usefull to mock just in case
 *
 * @param {String} url - url relative to api.github.com to mock
 * @param {String|Object} body - body to respond with
 * @param {Number} [reply=200] - HTTP response code
 * @return {Object} - nock mock object
 */
export function mock (url, body, reply = 200) {
  return nock('https://api.github.com:443', { encodedQueryParams: true })
  .matchHeader('Accept', 'application/vnd.github.machine-man-preview+json')
  .matchHeader('Authorization', (head) => {
    if (head.substring(0, 6) === 'Bearer') return /Bearer [a-z0-9]{30,}/i.test(head)

    return true
  })
  .replyContentLength()
  .replyDate()
  .post(url)
  .reply(reply, body, {
    server: 'GitHub.com',
    connection: 'close',
    'cache-control': 'public, max-age=60, s-maxage=60',
    vary: 'Accept, Accept-Encoding',
    etag: '"a8e448a94v8w198bvw4e846efwefxd34"',
    'x-github-media-type': 'github.machine-man-preview; format=json',
    'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
    'access-control-allow-origin': '*',
    'content-security-policy': 'default-src \'none\'',
    'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'deny',
    'x-xss-protection': '1; mode=block',
    'x-served-by': 'w498ve4q56189w48e9g4s5a6d41189wf',
    'x-github-request-id': '12457896:7384:4857186:94875132'
  })
}
