/**
 * lib/request.js
 * Wrapper for superagent to support promises
 *
 * @exports {Function} - Superagent
 */

import superagent from 'superagent-use'
import superpromise from 'superagent-promise-plugin'

superpromise.Promise = require('bluebird')

superagent.use(superpromise)

export default superagent
