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

import dgram from 'dgram'
import path from 'path'
import semver from 'semver'

import Log from 'lib/log'
import Project from 'lib/database/project'

const log = new Log('telemetry')
const server = dgram.createSocket('udp4')

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
  const arr = message.split(': ')[1].split('|')

  return {
    client: arr[0],
    status: Number(arr[1]),
    path: arr[2],
    file: path.basename(arr[2]),
    ext: path.extname(arr[2]),
    bytes: Number(arr[3]),
    agent: arr[4],
    time: Number(arr[5])
  }
}

/**
 * handleMessage
 * Handles the Syslog messages sent by the download Server
 *
 * TODO: we might want to consider adding an IP origin filter to avoid bad eggs
 * TODO: add some unique test, probably with client's ip address
 *
 * @param {Buffer} buf - syslog message
 *
 * @return {Void}
 */
export async function handleMessage (buf) {
  const data = parseMessage(buf.toString('utf8'))
  const [name, version] = data.file.split('_')

  if (data.ext !== '.deb') {
    log.debug('Invalid file extension')
    return
  }

  if (data.status >= 400) {
    log.debug('Download did not complete')
    return
  }

  if (semver.valid(version) === false) {
    log.debug('Received invalid semver version')
    return
  }

  log.debug(`Download ping for "${name}" and "${version}"`)

  const project = await Project.findOne({ name })
  if (project == null) {
    log.debug('Project not found')
    return
  }

  const release = project.releases.find((release) => (release.version === version))
  if (release == null) {
    log.debug('Release not found')
    return
  }

  await release.incrementDownload(1)
  log.debug(`Added download of ${name}#${version}`)
}

server.on('message', (msg) => handleMessage(msg))

server.on('listening', () => {
  log.info(`Listening`)
})

server.on('error', (err) => {
  log.error(err)
  log.report(err)
})

server.on('close', () => {
  log.debug('Closing')
})

export default server
