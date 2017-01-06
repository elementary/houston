/**
 * test/helpers/database.js
 * Common database helpers
 *
 * @exports {Function} startContainer - creates a new mongo container for database tests
 * @exports {Function} stopContainer - stops docker container and deletes it
 */

import Docker from 'dockerode'
import http from 'http'

/**
 * getPort
 * Generates a random port to use
 *
 * @async
 * @returns {Number} - a free port to use
 */
const getPort = () => {
  const server = http.createServer()

  return new Promise((resolve, reject) => {
    server.listen(0)

    server.on('listening', () => {
      const port = server.address().port
      server.close()
      return resolve(port)
    })

    server.on('error', (err) => {
      return reject(err)
    })
  })
}

/**
 * startContainer
 * Creates a new container for testing database things
 *
 * @async
 * @param {String} socket - socket path for docker
 * @return {Object} - dockerode container with mongo variable as connection details
 */
export async function startContainer (socket) {
  const docker = new Docker({ socketPath: socket })
  const port = await getPort()

  const containerConfig = {
    Image: 'mongo',
    ExposedPorts: {
      '27017/tcp': {}
    },
    HostConfig: {
      PortBindings: {
        '27017/tcp': [{ HostPort: String(port) }]
      }
    }
  }

  const container = await new Promise((resolve, reject) => {
    docker.createContainer(containerConfig, (err, container) => {
      if (err != null) return reject(err)
      return resolve(container)
    })
  })

  await new Promise((resolve, reject) => {
    container.start((err, data, container) => {
      if (err != null) return reject(err)
      return resolve(container)
    })
  })

  // TODO: we can make this smaller / do a smarter timeout
  await new Promise((resolve) => {
    setTimeout(() => {
      return resolve()
    }, 1000)
  })

  container.mongo = `mongodb://127.0.0.1:${port}/houston-test`

  return container
}

/**
 * stopContainer
 * Stops a given container and removes it from docker
 *
 * @async
 * @param {Object} container - dockerode container object
 * @returns {Void}
 */
export function stopContainer (container) {
  return new Promise((resolve, reject) => {
    container.stop((err, data) => {
      if (err) return reject(err)

      container.remove((err, data) => {
        if (err) return reject(err)

        return resolve()
      })
    })
  })
}
