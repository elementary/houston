/**
 * lib/atc.js
 * Wrapper for socket.io that includes message queue and pool support. Most of
 * this code is for client connection to "houston" type socket. for "houston"
 * specific class see ~/houston/service/atc
 *
 * @exports {Class} - Wrapper for socket.io that includes message queue and pool support
 */

import _ from 'lodash'
import crypto from 'crypto'
import events from 'events'

import log from './log'

/**
 * Atc
 * for communicating between different processes and servers, includes message queue
 *
 * @param {String} type - Connection type ("flightcheck" or "houston")
 */
export default class extends events.EventEmitter {
  constructor (type) {
    if (type == null) {
      throw new Error('Atc requires a "type" for contruction')
    }

    super()

    this.type = type

    this.queue = {}
    this.sent = {}

    this.connections = {}
  }

  /**
   * connect
   * sets up a connection to server
   *
   * @param {String} listen - url to conenct to
   */
  connect (listen) {
    if (typeof listen !== 'string') {
      throw new Error('Atc connect requires a "listen" string to connect to')
    }

    this.io = require('socket.io-client').connect(listen)

    // A lot of the code below looks pointless, but it's for keeping things
    // consistent for a server which would have multiple connections
    this.io.on('connect', () => {
      log.debug('Atc connection established')

      this.io.emit('atc:type', this.type)

      if (this.connections['houston'] == null) this.connections['houston'] = []
      this.connections['houston'][0] = this.io

      this.reconnect('houston')
    })

    this.io.on('disconnect', () => {
      log.debug('Atc connection lost')

      if (this.connections['houston'] == null) this.connections['houston'] = []
      this.connections['houston'][0] = null
    })

    // Socket listeners
    this.io.on('msg:send', (subject, data) => {
      this.emit(subject, data)

      this.io.emit('msg:confirm', this.hash(data))
    })

    this.io.on('msg:confirm', (hash) => {
      const i = _.findIndex(this.sent['houston'], (obj) => {
        return obj.hash === hash
      })

      this.emit(`${this.sent['houston'][i]['subject']}:received`)
      this.sent['houston'] = _.pullAt(this.sent['houston'], i)
    })
  }

  /**
   * reconnect
   * handles messages in queue after connection or reconnection
   *
   * @param {String} type - type of socket connected to
   */
  reconnect (type) {
    if (typeof type !== 'string') {
      throw new Error('Atc reconnect requires a valid "type" value')
    }

    if (this.queue[type] == null) this.queue[type] = []

    return Promise.each(this.queue[type], (msg) => {
      return this.delegate(type)
      .then((socket) => {
        socket.emit(msg.r, msg.subject, msg.message)
        this.sent[type].push({
          socket,
          subject: msg.subject,
          message: msg.message,
          hash: this.hash(msg.message)
        })
        this.queue[type] = _.remove(this.queue[type], (obj) => {
          return obj === msg
        })
      })
    })
  }

  /**
   * delegate
   * returns a socket to send messages to
   *
   * @param {String} type - type of socket to send to ("flightcheck" or "houston")
   * @returns {Promise} - An socket to emit to
   */
  delegate (type) {
    return new Promise((resolve, reject) => {
      if (typeof type !== 'string') {
        reject('Atc delegate requires a "type" string to find socket')
      }
      if (type !== 'houston') {
        reject('Atc can only communicate with houston')
      }
      if (this.connections['houston'][0] == null) {
        reject('Atc has no avalible connections')
      }

      resolve(this.connections['houston'][0])
    })
  }

  /**
   * hash
   * hashes a blob
   *
   * @param {Blob} msg - what to be hashed
   * @returns {String} - hash of msg
   */
  hash (msg) {
    return crypto
    .createHash('sha256')
    .update(JSON.stringify(msg))
    .digest('hex')
  }

  /**
   * send
   * sends message to specified client
   *
   * @param {String} to - who to send message to ("flightcheck" or "houston")
   * @param {String} subject - subject of message, used for event handling
   * @param {Blob} message - what to send to client
   * @returns {Promise} - promise that the message was send or is in queue to be sent
   */
  send (to, subject, message) {
    if (typeof to !== 'string') {
      throw new Error('Atc send requires a valid "to" value')
    }
    if (typeof subject !== 'string') {
      throw new Error('Atc send requires a valid "from" value')
    }
    if (message == null) {
      throw new Error('Atc send requires some message to send')
    }

    if (this.queue[to] == null) this.queue[to] = []
    if (this.sent[to] == null) this.sent[to] = []
    if (this.connections[to] == null) this.connections[to] = []

    return this.delegate(to)
    .then((socket) => {
      socket.emit('msg:send', subject, message)
      this.sent[to].push({
        subject,
        message,
        socket,
        hash: this.hash(message)
      })
    })
    .catch(() => {
      this.queue[to].push({r: 'msg:send', subject, message})
    })
  }
}
