/**
 * houston/test/utility/docker.ts
 * Usefull utility functions for testing with docker.
 * TODO: This has very similar content to the `worker/docker.ts` file.
 * TODO: We need to make this more specific and only remove the given images
 *
 * @exports {Function} teardown - Removes all current containers
 */

import * as Dockerode from 'dockerode'

import { Config } from '../../src/lib/config'

/**
 * removeImage
 * Removes an image from the docker server
 *
 * @async
 * @param {Config} config The configuration to use to connect to docker
 * @param {string} image The name of the image to remove
 * @return {void}
 */
export async function removeImages (config: Config, image: string): Promise<void> {
  const docker = new Dockerode(config.get('docker'))

  const images = await docker.listImages()
    .then((imageInfos) => {
      return imageInfos.filter((imageInfo) => {
        return (imageInfo.RepoTags || [])
          .some((tag) => tag.startsWith(image))
      })
    })
    .then((imageInfos) => {
      return imageInfos.map((imageInfo) => docker.getImage(imageInfo.Id))
    })

  await Promise.all(images.map((i) => {
    i.remove({ force: true }).catch((err) => {
      // If the image is not found, or is currently being used
      if (err.statusCode !== 404 && err.statusCode !== 409) {
        // tslint:disable-next-line no-console
        console.error('Unable to remove docker image', err)
      }
    })
  }))
}
