/**
 * houston/src/worker/docker.ts
 * A helpful class for using docker.
 *
 * @exports {Class} Docker - A helpful class for using docker.
 */

import * as Dockerode from 'dockerode'
import * as fs from 'fs-extra'
import * as Stream from 'stream'

import { Config } from '../lib/config'

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
   * tag
   * The docker image tag
   */
  protected tag = 'latest'

  /**
   * mounts
   * All of the directories that will be mounted on the container.
   * NOTE: Key is local folder, value is container folder.
   *
   * @var {object}
   */
  protected mounts = {}

  /**
   * Creates a new docker container class
   *
   * @param {Config} config - The configuration to use
   * @param {string} name - The docker image to use
   */
  constructor (config: Config, name: string) {
    this.config = config
    this.docker = new Dockerode(config.get('docker'))

    this.name = `houston-${name}`
  }

  /**
   * options
   * All of the docker options that will get passed on running the container.
   *
   * @return {object}
   */
  public get options () {
    const options = {
      Binds: [] as string[]
    }

    Object.keys(this.mounts).forEach((local) => {
      options.Binds.push(`${local}:${this.mounts[local]}:rw`)
    })

    return options
  }

  /**
   * mount
   * Adds a mount point to the container
   *
   * @param {string} from - The local directory to attach
   * @param {string} to - The container directory to mount to
   * @return {Docker}
   */
  public mount (from: string, to: string): this {
    this.mounts[from] = to

    return this
  }

  /**
   * exists
   * Checks if the image currently exists.
   *
   * @async
   * @param {string} tag - Docker image tag to check for
   * @return {boolean}
   */
  public async exists (tag = this.tag): Promise<boolean> {
    const images = await this.docker.listImages()

    const foundImages = images.filter((image) => {
      let found = false

      image.RepoTags.forEach((imageTag) => {
        if (imageTag === `${this.name}:${tag}`) {
          found = true
        }
      })

      return found
    })

    return (foundImages.length !== 0)
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

    await new Promise((resolve, reject) => {
      this.docker.buildImage({
        context: folder,
        src: files
      }, { t: this.name }, (err, stream) => {
        if (err != null) {
          return reject(err)
        }

        this.docker.modem.followProgress(stream, resolve)
      })
    })
  }

  /**
   * run
   * Runs a container with the given command and mounts
   *
   * @param {string} cmd - Command to run
   * @param {object} [opts] - Additional options to pass to container
   * @return {number} - Container exit code
   */
  public async run (cmd: string, opts = {}): Promise<number> {
    const log = await this.setupLog()
    const commands = cmd.split(' ')
    const options = Object.assign({}, this.options, opts)

    const res = await this.docker.run(this.name, commands, log, options)

    await res.container.remove()
    return res.data.StatusCode
  }

  /**
   * setupLog
   * Creates / Clears the log file
   *
   * @async
   * @return {Stream}
   */
  protected async setupLog (): Promise<Stream> {
    if (this.log == null) {
      return new Stream()
    }

    await fs.ensureFile(this.log)
    return fs.createWriteStream(this.log)
  }
}
