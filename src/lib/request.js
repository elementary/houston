/**
 * lib/request.js
 * Wrapper for superagent to support promises
 *
 * @exports {Object} - Superagent
 */

import superagent from 'superagent'

// Once upon a time, when superagent wasn't as cool, we had to use plugins for
// the most basic of things. Things like promise support. Then our salvation came
// in the form of @next. Now we no longer need to use plugins, but we like to
// keep this file here as a reminder of a time less awesome.
// RIP need for superagent plugins (2016-2016)

export default superagent
