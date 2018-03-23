/**
 * houston/src/worker/task/build/deb.ts
 * Builds a debian package
 */

import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'

import { glob } from '../../../lib/utility/glob'
import render from '../../../lib/utility/template'
import { Docker } from '../../docker'
import { Log } from '../../log'
import { Change } from '../../type'
import { Task } from '../task'

export class BuildDeb extends Task {

  /**
   * Returns the path of the liftoff cache
   *
   * @return {string}
   */
  protected static get cachePath () {
    return path.resolve(os.tmpdir(), 'liftoff')
  }

  /**
   * Location of the liftoff log
   *
   * @return {string}
   */
  protected get logPath () {
    return path.resolve(this.worker.workspace, 'build.log')
  }

  /**
   * Location of the directory to build
   *
   * @return {string}
   */
  protected get path () {
    return path.resolve(this.worker.workspace, 'build')
  }

  /**
   * Returns the liftoff distribution to use.
   * NOTE: Because liftoff does not know about elementary distros, we map
   * them to the Ubuntu equivalents
   *
   * @return {string}
   */
  protected get distribution () {
    switch (this.worker.storage.distribution) {
      case ('loki'):
        return 'xenial'
      case ('juno'):
        return 'bionic'
      default:
        return this.worker.storage.distribution
    }
  }

  /**
   * Runs liftoff
   *
   * @async
   * @return {void}
   */
  public async run () {
    await this.setup()

    const docker = await this.docker()

    const arch = this.worker.storage.architecture
    const dist = this.distribution
    const cmd = `-a ${arch} -d ${dist} -o /tmp/houston`

    // Liftoff uses chroot, so we need higher permissions to run
    const exit = await docker.run(cmd, { Privileged: true })

    if (exit !== 0) {
      throw await this.log()
    }

    await this.teardown()
  }

  /**
   * Ensures the build directory is ready for docker
   *
   * @async
   * @return {void}
   */
  protected async setup () {
    const from = path.resolve(this.worker.workspace, 'clean')

    await fs.ensureDir(this.path)
    await fs.copy(from, this.path)
  }

  /**
   * Returns the first known good package path. Used for when projects make
   * more than one package. We need to run tests on the main one.
   * TODO: Do tests on all the packages made
   *
   * @return {string|null}
   */
  protected async package () {
    const storage = this.worker.storage

    // The correct name scheme
    const domainName = `${storage.nameDomain}_${storage.version}_${storage.architecture}.${storage.packageSystem}`
    const domainNamed = await glob(path.resolve(this.path, domainName))

    if (domainNamed[0] != null) {
      return domainNamed[0]
    }

    const allNames = await glob(path.resolve(this.path, `*.${storage.packageSystem}`))

    // Try to intelligently filter out the _extra_ packages.
    const filteredNames = allNames
      .map(path.basename) // The file name without full path
      .filter((n) => !n.startsWith('lib'))
      .filter((n) => (n.indexOf('-dev') === -1))
      .filter((n) => (n.indexOf('-dbg') === -1))

    if (filterednames[0] != null) {
      return path.resolve(this.path, filteredNames[0])
    }

    // So... Last effort, we get all the package files, sort them by length, and
    // Pick the shortest one.
    const sortedNames = allNames.sort((a, b) => (a.length - b.length))

    if (sortedNames[0] != null) {
      return sortedNames[0]
    }
  }

  /**
   * Removes the messy build directory after copying the package to workspace
   *
   * @async
   * @return {void}
   */
  protected async teardown () {
    const deb = await this.package()

    if (deb == null) {
      throw new Log(Log.Level.ERROR, 'Build completed but no Debian package was found')
    }

    const to = path.resolve(this.worker.workspace, 'package.deb')
    await fs.copy(deb, to)

    await fs.remove(this.path)
  }

  /**
   * Formats a liftoff error
   *
   * @async
   * @return {Log}
   */
  protected async log () {
    const p = path.resolve(__dirname, 'deb.md')
    const log = await fs.readFile(this.logPath, 'utf8')

    return Log.template(Log.Level.ERROR, p, {
      log,
      storage: this.worker.storage
    })
  }

  /**
   * Returns a docker instance to use for liftoff
   *
   * @async
   * @return {Docker}
   */
  protected async docker (): Promise<Docker> {
    const docker = new Docker(this.worker.config, 'build-deb')

    const exists = await docker.exists()
    if (exists === false) {
      const folder = path.resolve(__dirname, 'deb')
      await docker.create(folder)
    }

    docker.log = this.logPath

    docker.mount(BuildDeb.cachePath, '/var/cache/liftoff')
    docker.mount(this.path, '/tmp/houston')

    return docker
  }
}
