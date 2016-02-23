/**
 * slave.js
 * Child script for running appHooks
 */

import Socket from 'socket.io-client'

import { run } from './appHooks'
import { Helpers, Config, Log } from './app'

const io = Socket.connect(Config.server.url)

io.on('connection', () => {
  Log.info('Connected to master')
})

io.on('disconnect', () => {
  Log.info('Disconnected to master')
})

io.on('cycle', data => {
  io.emit('received', data._id)
  Log.info(`Received cycle data for ${data._id}`)
  data.status = 'PRE'

  run(data)
  .then(pkg => {
    io.emit('finished', pkg)
    Log.debug(`Found ${Helpers.ArrayString('error', pkg.errors)} in ${data.cycle._id}`)
    Log.info(`Sent cycle data for ${data.cycle._id}`)
  })
})
