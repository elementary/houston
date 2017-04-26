/**
 * service/mandrill.js
 * Handles sending emails to people about things.
 * @flow
 *
 * @exports {Object} default - superagent for communicating with mandrill
 */

import { domain } from 'lib/request'
import * as error from 'lib/error/service'
import config from 'lib/config'
import Log from 'lib/log'
import Project from 'lib/database/project'

const log = new Log('service:mandrill')

const api = domain('https://mandrillapp.com/api/1.0')
.use((req) => {
  req.set('User-Agent', 'elementary-houston')
})

export default api

/**
 * errorCheck
 * Checks generatic mandrill status codes for a more descriptive error
 *
 * @param {Error} err - superagent error to check
 * @param {Object} [res] - mandrill response object
 * @returns {ServiceError} - a parsed error from mandrill
 */
const errorCheck = (err: Object, res: ?Object): error.ServiceError => {
  if (err.status === 401) {
    log.info(`Bad credentials`)
    return new error.ServiceError('Mandrill', 'Bad Credentials')
  }

  if (err.status === 429) {
    log.warn('Exceeding maximum number of authentication calls to Mandrill')
    return new error.ServiceLimitError('Mandrill')
  }

  if (res != null) {
    if (res.body != null && res.body.status === 'error' && res.body.message != null) {
      log.error(res.body.message)

      return new error.ServiceRequestError('Mandrill', res.status, res.body.name)
    }

    log.error(err.toString())
    return new error.ServiceRequestError('Mandrill', res.status, err.toString())
  }

  log.error(err)
  return new error.ServiceError('Mandrill', err.toString())
}

/**
 * postReceipt
 * Sends a receipt email to a user after purchase
 * TODO: we need to save parsed appstream data for more human friendly names
 * TODO: save icon path or data for email receipts
 *
 * @param {Project} project - The project that was purchased
 * @param {String} email - The email address to send the receipt to
 * @param {Number} amount - The amount of money the purchase was in cents
 *
 * @returns {String} - Mandrill email ID
 */
export function postReceipt (project: Project, email: string, amount: number): Promise<string> {
  if (!config.mandrill || !config.mandrill.key) {
    log.debug('Key not configured. Throwing errors')
    throw new error.ServiceConfigError('Mandrill', 'mandrill.key', 'Not set')
  }

  if (!config.mandrill || !config.mandrill.purchaseTemplate) {
    log.debug('Template not configured for purchases. Throwing errors')
    throw new error.ServiceConfigError('Mandrill', 'mandrill.purchaseTemplate', 'Not set')
  }

  const price = `$${(amount * 100).toFixed(2)}`

  const req = [{
    name: 'app-name',
    content: project.name
  }, {
    name: 'app-icon',
    content: 'https://developer.elementary.io/images/system-software-install.svg'
  }, {
    name: 'amount',
    content: price
  }, {
    name: 'developer-name',
    content: project.github.owner
  }, {
    name: 'developer-url',
    content: `https://github.com/${project.github.owner}`
  }, {
    name: 'app-help',
    content: `https://github.com/${project.github.owner}/${project.github.name}/issues`
  }]

  return api
  .post('/messages/send-template.json')
  .send({
    'key': config.mandrill.key,
    'template_name': config.mandrill.purchaseTemplate,
    'template_content': [req],
    'message': {
      'subject': 'AppCenter Purchase',
      'from_email': 'payment@elementary.io',
      'from_name': 'elementary',
      'to': [{
        email,
        'type': 'to'
      }],
      'headers': {
        'Reply-To': 'payment@elementary.io'
      },
      'important': false,
      'merge': true,
      'merge_language': 'handlebars',
      'global_merge_vars': [req],
      'tags': ['appcenter', 'purchase']
    },
    'async': true
  })
  .then((res) => res.body[0]._id)
  .catch((err, res) => {
    throw errorCheck(err, res)
  })
}
