/**
 * core/io.js
 * Handles master communication to slaves
 */

// TODO: this whole file could use a good look through and cleanup
import Socket from 'socket.io'

import { Helpers, Log } from '~/app'

let Io = new Socket()

// TODO: handshake and security stuff
Io.on('connection', socket => {
  socket.emit('connection')

  Log.info(`Now controlling ${Helpers.ArrayString('slave', Io.engine.clientsCount)}`)

  socket.on('disconnect', socket => {
    Log.info(`Now controlling ${Helpers.ArrayString('slave', Io.engine.clientsCount)}`)
  })

  socket.on('report', (message, data) => {
    if (message === 'received') Log.verbose(`Slave received cycle data for data ${data}`)
    if (message === 'finished') Log.verbose(`Slave finished cycle work for ${data.cycle}`)
  })
})

export default { Io }
