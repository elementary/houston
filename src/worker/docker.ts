/**
 * houston/src/worker/docker.ts
 * A helpful class for using docker.
 *
 * @exports {Class} Docker - A helpful class for using docker.
 */

import Dockerode from 'dockerode'
import * as fs from 'fs-extra'

import { Config } from '../lib/config/class'

export class Docker {

  /**
   * log
   * The file to log to when running the container
   *
   * @var {string}
   */
  public log?: string

  /**
   * config
   * The configuration to use for connecting to docker
   *
   * @var {Config}
   */
  protected config: Config

  /**
   * docker
   * The dockerode instance
   *
   * @var {Dockerode}
   */
  protected docker: Dockerode

  /**
   * name
   * The docker image name to use
   *
   * @var {string}
   */
  protected name: string

  /**
   * mountes
   * All of the directories that will be mounted on the container.
   * NOTE: Key is local folder, value is container folder.
   *
   * @var {object}
   */
  protected mountes = {}

  /**
   * Creates a new docker container class
   *
   * @param {Config} config - The configuration to use
   * @param {string} name - The docker image to use
   */
  constructor (config: Config, name: string) {
    this.config = config
    this.docker = new Dockerode(config.get('docker'))

    this.name = name
  }

  /**
   * mount
   * Adds a mount point to the container
   *
   * @param {string} from - The local directory to attach
   * @param {string} to - The container directory to mount to
   * @return {void}
   */
  public mount (from: string, to: string): void {
    this.mountes[from] = to
  }

  /**
   * exists
   * Checks if the image currently exists.
   *
   * @async
   * @param {string} tag - Docker image tag to check for
   * @return {boolean}
   */
  public async exists (tag = 'latest'): Promise<boolean> {
    const images = await this.docker.listImages()

    const foundImage = images.find((image) => {
      return image.RepoTags.find((imageTag) => {
        return (imageTag === `${this.name}:${tag}`)
      })
    })

    return (foundImage != null)
  }

  /**
   * create
   * Creates a docker image from a directory of files.
   *
   * @async
   * @param {string} folder - The folder to create the image from
   * @return {void}
   */
  public async create (folder: string): Promise<void> {
    const files = await fs.readdir(folder)

    await this.docker.buildImage({
      context: folder,
      src: files
    }, { t: this.name })
  }

  /**
   * run
   * Runs a container with the given command and mounts
   *
   * @param {string} cmd - Command to run
   * @return {number} - Container exit code
   */
  public async run (cmd: string): Promise<number> {
    return 0
  }

  /**
   * setupLog
   * Creates / Clears the log file
   *
   * @async
   * @return {void}
   */
  protected async setupLog (): Promise<void> {
    if (this.log == null) {
      return
    }

    await fs.ensureFile(this.log)
  }
}
