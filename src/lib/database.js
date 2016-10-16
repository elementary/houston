/**
 * lib/database.js
 * Sets up database connection
 *
 * @exports {Object} - initialized mongoose object
 */

import mongoose from 'mongoose'

import config from './config'
import Log from './log'

const log = new Log('lib:database')

mongoose.Promise = global.Promise

mongoose.connect(config.database)

mongoose.connection.on('error', (msg) => log.error(msg))

mongoose.connection.once('open', () => log.info('Connected to database'))

mongoose.connection.once('close', () => log.warn('Disconnected to database'))

export default mongoose
