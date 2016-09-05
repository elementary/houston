import config from '~/lib/config'
import Project from '~/houston/model/project'
import Syslogd from 'syslogd'
import log from '~/lib/log'
import path from 'path'

function startSyslog () {
  Syslogd(handleMessage).listen(config.downloads.syslog_port, (err) => {
    if (err) {
      // TODO: Change this for proper logging
      log.error(err)
    } else {
      log.info('Download Server Statistics Capturing started successfully')
    }
  })
}

/**
 * Handles the Syslog messages sent by the download Server
 *
 * TODO: we might want to consider adding an IP origin filter to avoid bad eggs
 * TODO: add some unique test, probably with client's ip address
 *
 * message.msg conatins the actual log message from nginx, which is setup to display
 * a specific log format of TODO: Insert Log format here
 */
function handleMessage (message) {
  var arr = message.msg.split('|')
  var data = {
    client: arr[0],
    status: arr[1],
    file: path.basename(arr[2]),
    bytes_sent: arr[3],
    download_time: arr[5]
  }

  if (path.extname(data.file) !== '.deb') {
    return
  }

  var filename = data.file.split('_')

  return Project.update({
    'name': filename[0],
    'releases.version': filename[1]
  }, {
    $inc: {
      'downloads': 1,
      'releases.$.downloads': 1
    }
  }).then((data) => {
    // TODO: Improve the logging here
    log.debug('Successfully saved a package download to the Database')
  })
}

export startSyslog
