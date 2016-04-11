/**
 * lib/atc.js
 * Wrapper for socket.io that includes message queue and pool support
 *
 * @exports {Function} send - Emits a message and waits for received confirmation
 * @exports {Function} release - Resends all messages that are on hold
 * @exports {Function} init - Starts or connects to socket server and handles events to atc
 */

import _ from 'lodash'
import crypto from 'crypto'
import events from 'events'

import helper from './helpers'
import log from './log'

const atc = new events.EventEmitter()
let io = new events.EventEmitter()

atc.connected = false
atc.holdMessages = []
atc.id = crypto.randomBytes(16).toString('hex')
atc.sentMessages = []
atc.type = null

/**
 * hashMessage
 * Hashes anything
 *
 * @param {Blob} message - what to be hashed
 * @returns {String} - hash of message
 */
const hashMessage = (message) => {
  const str = JSON.stringify(message)
  return crypto
  .createHash('sha256')
  .update(str)
  .digest('hex')
}

/**
 * send
 * Emits a message and waits for received confirmation
 *
 * @param {String} subject - unique identifier about what is being sent
 * @param {Blob} message - what to be sent
 * @param {Function} cb - callback after received confirmation
 */
atc.send = (subject, message, cb) => {
  if (atc.type !== 'server' || atc.type !== 'client') {
    throw new Error('Atc type is not set')
  }

  if (subject == null) {
    throw new Error('Atc unable to send with subject')
  }

  if (message == null) {
    throw new Error('Atc unable to send blank message')
  }

  const hash = hashMessage(message)
  log.debug(`Atc sending message ${subject}`)

  if (atc.connected) {
    // TODO: we can do better deligating than just sockets.emit
    if (atc.type === 'server') {
      io.sockets.emit('msg:send', subject, message)
    } else if (atc.type === 'client') {
      io.emit('msg:send', subject, message)
    }

    atc.sentMessages.push({subject, message, hash, cb})
  } else {
    atc.holdMessages.push({subject, message, hash, cb})
  }
}

/**
 * release
 * Resends all messages that are on hold
 */
atc.release = () => {
  if (atc.holdMessages.length > 0) {
    log.debug(`Atc releasing ${helper.lang.s('message', atc.holdMessages)}`)
  }

  for (let i = atc.holdMessages.length; i--;) {
    const message = atc.holdMessages[i]

    atc.holdMessages.splice(i, 1)
    atc.send(message.subject, message.message, message.cb)
  }
}

/**
 * init
 * Starts or connects to socket server and handles events to atc
 *
 * @param {String} type - 'server' or 'client' socket type
 * @param {Blob} connect - string for client connect or server for server attach
 */
atc.init = (type, connect) => {
  if (type === 'server') {
    log.debug('Turning into atc server')
    atc.type = 'server'

    const Socket = require('socket.io')
    io = new Socket()
    io.listen(connect)
  } else if (type === 'client') {
    log.debug('Turning into atc client')
    atc.type = 'client'

    const Socket = require('socket.io-client')
    io = Socket.connect(connect)
  } else {
    throw new Error('Atc requires a type of "server" or "client"')
  }

  if (type === 'server') {
    io.on('connection', (socket) => {
      atc.connected = true
      log.debug('Atc gained client')

      atc.release()

      socket.on('msg:send', (subject, message) => {
        const hash = hashMessage(message)
        log.silly(`Atc received message ${subject}`)

        socket.emit('msg:confirm', hash)
        atc.emit(subject, message)
      })

      socket.on('msg:confirm', (hash) => {
        const index = _.findIndex(atc.sentMessages, (m) => m.hash === hash)

        if (index !== -1) {
          const message = atc.sentMessages[index]
          atc.sentMessages.splice(index, 1)

          log.silly(`Atc received confirmation of ${message.subject}`)

          if (message.cb != null) {
            message.cb()
          }
        }
      })

      socket.on('disconnect', () => {
        atc.connected = false
        log.debug('Atc lost client')
      })
    })
  }

  if (type === 'client') {
    io.on('connect', () => {
      atc.connected = true
      log.debug('Atc connected to tower')

      log.release()
    })

    io.on('msg:send', (subject, message) => {
      const hash = hashMessage(message)
      log.silly(`Atc received message ${subject}`)

      io.emit('msg:confirm', hash)
      atc.emit(subject, message)
    })

    io.on('msg:confirm', (hash) => {
      const index = _.findIndex(atc.sentMessages, (m) => m.hash === hash)

      if (index !== -1) {
        const message = atc.sentMessages[index]
        atc.sentMessages.splice(index, 1)

        log.silly(`Atc received confirmation of ${message.subject}`)

        if (message.cb != null) {
          message.cb()
        }
      }
    })

    io.on('disconnect', () => {
      atc.connected = false
      log.debug('Atc disconnected from tower')
    })
  }
}

export default atc
