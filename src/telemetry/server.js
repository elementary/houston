/**
 * telemetry/server.js
 * Starts a syslog server for nginx to send download statistics
 *
 * NOTE: the telemetry server requires a special format for syslog messages:
 * $remote_addr|$status|$request_filename|$body_bytes_sent|$http_user_agent|$request_time
 *
 * @exports {Object} default - a syslog server to call listen on
 * @exports {Function} parseMessage - Parses a raw syslogd message to usable parts
 * @exports {Function} handleMessage - Adds package download information to database
 */

import path from 'path'
import semver from 'semver'
import syslogd from 'syslogd'

import Log from 'lib/log'
import Project from 'lib/database/project'

const log = new Log('telemetry')
const server = syslogd(handleMessage)

/**
 * parseMessage
 * Splits the nginx syslog message to usable data
 *
 * @param {String} message - syslog message
 *
 * @returns {Object} - parsed usable data
 * @returns {String} client - IP address of client
 * @returns {String} status - Status of the download
 * @returns {String} path - Full path of downloaded file
 * @returns {String} file - File name of the file downloaded
 * @returns {String} ext - File extension
 * @returns {String} bytes - The amount of bytes sent during download
 * @returns {String} time - The amount of time it took to download
 */
export function parseMessage (message) {
  const arr = message.msg.split('|')

  return {
    client: arr[0],
    status: arr[1],
    path: arr[2],
    file: path.basename(arr[2]),
    ext: path.extname(arr[2]),
    bytes: arr[3],
    time: arr[4]
  }
}

/**
 * handleMessage
 * Handles the Syslog messages sent by the download Server
 *
 * TODO: we might want to consider adding an IP origin filter to avoid bad eggs
 * TODO: add some unique test, probably with client's ip address
 *
 * @param {Object} message - syslog message
 *
 * @return {Void}
 */
export async function handleMessage (message) {
  const data = parseMessage(message)
  const [name, version] = data.file.split('_')

  if (data.ext !== '.deb') return
  if (data.status !== 'OK') return

  if (semver.valid(version) === false) {
    log.debug('Received invalid semver version')
  }

  await Project.update({
    name,
    'releases.version': version
  }, {
    $inc: {
      'downloads': 1,
      'releases.$.downloads': 1
    }
  })

  log.debug(`Successful download of ${name}#${version}`)
}

server.server.on('listening', () => {
  log.info(`Listening on ${server.port}`)
})

server.server.on('error', (err) => {
  log.error(err)
  log.report(err)
})

server.server.on('close', () => {
  log.debug('Closing')
})

export default server
