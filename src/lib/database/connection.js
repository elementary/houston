/**
 * lib/database.js
 * Sets up database connection
 *
 * @exports {Object} - initialized mongoose object
 */

import mongoose from 'mongoose'

import config from 'lib/config'
import Log from 'lib/log'

const log = new Log('lib:database')

mongoose.Promise = global.Promise

mongoose.connection.on('error', (msg) => log.error(msg))

mongoose.connection.once('open', () => log.info('Connected to database'))

mongoose.connection.once('close', () => log.warn('Disconnected to database'))

// BUG: due to file loading something something mongoose will try to connect twice.
// This 1ms timeout makes sure that doesn't happen and prevents some mongoose errors
// poping up to the surface.
setTimeout(() => {
  if (mongoose.connection.host == null) {
    mongoose.connect(config.get('database'))
  }
}, 1)

export default mongoose
