/**
 * houston/service/atc.js
 * Wrapper for socket.io that includes message queue and pool support. Most of
 * this code is for server connection. for client specific class see ~/lib/atc
 *
 * @exports {Class} - Initalized houston type atc connection
 */

import _ from 'lodash'

import Atc from '~/lib/atc'
import log from '~/lib/log'

/**
 * AtcServer
 * for communicating between different processes and servers, includes message queue
 */
class HoustonAtc extends Atc {
  constructor () {
    super('houston')
  }

  /**
   * connect
   * sets up a connection to server
   *
   * @param {Object} listen - server to attach to
   */
  connect (listen) {
    if (typeof listen !== 'object') {
      throw new Error('Atc connect requires an http instance to connect to')
    }

    this.io = require('socket.io')(listen)

    this.io.on('connection', (socket) => {
      socket.on('atc:type', (type) => {
        socket.type = type

        log.debug(`Atc gained a "${type}" connection`)

        if (this.connections[type] == null) this.connections[type] = []
        this.connections[type].push(socket)
      })

      socket.on('disconnect', () => {
        log.debug(`Atc lost a "${socket.type}" connection`)

        this.connections[socket.type] = _.remove(this.connections[socket.type], (obj) => {
          return obj === socket
        })
      })

      // Socket listeners
      socket.on('msg:send', (subject, data) => {
        this.emit(subject, data)

        socket.emit('msg:confirm', this.hash(data))
      })

      socket.on('msg:confirm', (hash) => {
        const i = _.findIndex(this.sent[socket.type], (obj) => {
          return obj.hash === hash
        })
        const message = this.sent[socket.type][i]

        this.emit(`${message.subject}:received`, message.message)
        this.sent[socket.type] = _.pullAt(this.sent[socket.type], i)
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
      if (this.connections[type].length <= 0) {
        reject('Atc has no avalible connections')
      }

      // TODO: we can do better than picking a random number for delegation
      resolve(_.sample(this.connections[type]))
    })
  }
}

export default new HoustonAtc()
