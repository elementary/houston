/**
 * houston/test/utility/docker.ts
 * Usefull utility functions for testing with docker
 *
 * @exports {Function} teardown - Removes all current containers
 */

import * as Dockerode from 'dockerode'

import { Config } from '../../src/lib/config'

/**
 * getContainers
 * Returns a list of containers docker has
 *
 * @async
 * @param {Config} config - The configuration to use to connect to docker
 * @return {Dockerode.Image}
 */
export async function getContainers (config: Config): Promise<Dockerode.Image> {
  const docker = new Dockerode(config.get('docker'))

  const containerInfos = await docker.listContainers()

  return containerInfos.map((containerInfo) => {
    return docker.getContainer(containerInfo.Id)
  })
}

/**
 * stopContainers
 * Stops all current running containers
 *
 * @async
 * @param {Config} config - The configuration to use to connect to docker
 * @return {void}
 */
export async function stopContainers (config: Config): Promise<void> {
  const containers = await getContainers(config)

  return Promise.all(containers.map((container) => container.stop()))
}

/**
 * removeContainers
 * Removes all the containers
 *
 * @async
 * @param {Config} config - The configuration to use to connect to docker
 * @return {void}
 */
export async function removeContainers (config: Config): Promise<void> {
  const containers = await getContainers(config)

  return Promise.all(containers.map((container) => container.remove()))
}

/**
 * removeImages
 * Removes all the houston related docker images
 *
 * @async
 * @param {Config} config - The configuration to use to connect to docker
 * @return {void}
 */
export async function removeImages (config: Config): Promise<void> {
  const docker = new Dockerode(config.get('docker'))

  const images = await docker.listImages()
  .then((imageInfos) => {
    return imageInfos.filter((imageInfo) => {
      let found = false

      imageInfo.RepoTags.forEach((tag) => {
        if (tag.startsWith('houston-') === true) {
          found = true
        }
      })

      return found
    })
  })
  .then((imageInfos) => {
    return imageInfos.map((imageInfo) => docker.getImage(imageInfo.Id))
  })

  return Promise.all(images.map((image) => {
    image.remove({ force: true }).catch((err) => {
      console.error('Unable to remove docker image', err)
    })
  }))
}

/**
 * teardown
 * Removes all current containers
 *
 * @async
 * @param {Database} database - The database connection to run migrations on
 * @return {void}
 */
export async function teardown (config: Config): Promise<void> {
  await stopContainers(config)
  await removeContainers(config)
  await removeImages(config)
}
