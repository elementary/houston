/**
 * houston/service/download.js
 * Starts a log server nginx debian repository download count tracking
 *
 * @exports {Function} handleMessage - Handles the Syslog messages sent by the download Server
 * @exports {Function} startSyslog - Starts a syslog server to handle nginx logs
 */

import path from 'path'
import semver from 'semver'
import syslogd from 'syslogd'

import config from 'lib/config'
import Log from 'lib/log'
import Project from 'houston/model/project'

const log = new Log('service:download')

/**
 * handleMessage
 * Handles the Syslog messages sent by the download Server
 *
 * TODO: we might want to consider adding an IP origin filter to avoid bad eggs
 * TODO: add some unique test, probably with client's ip address
 *
 * @param {String} message - nginx log message in ($remote_addr|$status|$request_filename|$body_bytes_sent|$http_user_agent|$request_time)
 * @return {Void}
 */
export function handleMessage (message) {
  const arr = message.msg.split('|')
  const data = {
    client: arr[0],
    status: arr[1],
    file: path.basename(arr[2]),
    bytes_sent: arr[3],
    download_time: arr[5]
  }

  const filename = data.file.split('_')

  if (path.extname(data.file) !== '.deb') return
  if (data.status !== 'OK') return
  if (semver.valid(filename[1]) == null) return

  return Project.update({
    'name': filename[0],
    'releases.version': filename[1]
  }, {
    $inc: {
      'downloads': 1,
      'releases.$.downloads': 1
    }
  })
  .then((data) => log.debug(`Download count of ${filename[0]}#${filename[1]} +1`))
}

/**
 * startSyslog
 * Starts a syslog server to handle nginx logs
 *
 * @return {Void}
 */
export function startSyslog () {
  syslogd(handleMessage).listen(config.downloads.port, (err) => {
    if (err) {
      log.error('Unable to start downloads syslog server')
      throw new Error(err)
    } else {
      log.info(`Downloads syslog server listening on ${config.downloads.port}`)
    }
  })
}
