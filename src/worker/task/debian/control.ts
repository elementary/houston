/**
 * houston/src/worker/task/debian/control.ts
 * Updates, lints, and validates the Debian control file.
 *
 * @exports {Function} run - Update, lint and validate control file.
 */

import * as fs from 'fs-extra'
import { get, set } from 'lodash'
import * as os from 'os'
import * as path from 'path'

import { Level, Log } from '../../log'
import { Task } from '../task'
import { Parser } from './controlParser'

export class DebianControl extends Task {

  /**
   * File location for the debian control file
   *
   * @var {string}
   */
  public static path = 'debian/control'

  /**
   * A list used files we need to verify the Debian control file
   *
   * @var {string[]}
   */
  public files = [DebianControl.path]

  /**
   * The parser to use when doing stuff to the debian control file
   *
   * @var {Parser}
   */
  public parser = new Parser(this.path)

  /**
   * Returns the full path for the debian control file and the current test.
   *
   * @return {String}
   */
  protected get path () {
    return path.resolve(this.worker.workspace, 'dirty', DebianControl.path)
  }

  /**
   * Checks the Debian control file for errors
   *
   * @async
   * @return {void}
   */
  public async run () {
    const exists = fs.pathExists(this.path)
    if (exists === false) {
      throw new Log(Log.Level.ERROR, 'Missing debian control file')
    }

    const data = await this.parser.read()

    this.fill(data)

    const logs = this.lint(data)
    const highestLog = logs.sort((a, b) => (b.level - a.level))

    if (logs.length > 0) {
      // TODO: Report errors
    }
  }

  /**
   * Fills in missing data.
   *
   * @async'
   * @param {Object} data
   * @return {void}
   */
  protected fill (data: object) {
    // Required fields by Debian law
    this.deepUpsert(data, 'Source', this.worker.storage.nameAppstream)
    this.deepUpsert(data, 'Maintainer', `${this.worker.storage.nameDeveloper} <appcenter@elementary.io>`)
    this.deepUpsert(data, 'Package', this.worker.storage.nameDomain)

    // Extra optional fun stuff
    this.deepUpsert(data, 'Priority', 'optional')
    this.deepUpsert(data, 'Standards-Version', this.worker.storage.version)
  }

  /**
   * Upserts a deep key in an object.
   *
   * @param {Object} data
   * @param {String} key
   * @param {String|Number} value
   * @return {void}
   */
  protected deepUpsert (data: object, key: string, value: string|number) {
    if (get(data, key) == null) {
      set(data, key, value)
    }

    return
  }

  /**
   * Lints an object representation of the Debian control file.
   *
   * @async
   * @param {Object} data
   * @return {Log[]}
   */
  protected lint (data: object): Log[] {
    const logs = []

    if (get(data, 'Source') !== this.worker.storage.nameAppstream) {
      logs.push(new Log(Level.ERROR, 'Source is not correct', `Source should be \`${this.worker.storage.nameAppstream}\``))
    }

    const maintainerMessage = 'Maintainer should be in the form of `Maintainer Name <maintainer@email.com>`'
    if (get(data, 'Maintainer') == null) {
      logs.push(new Log(Level.ERROR, 'Maintainer is missing', maintainerMessage))
    } else if (/^.*\s<.*>$/.test(get(data, 'Maintainer')) === false) {
      logs.push(new Log(Level.ERROR, 'Maintainer is incorrect', maintainerMessage))
    }

    if (get(data, 'Package') !== this.worker.storage.nameDomain) {
      logs.push(new Log(Level.ERROR, 'Package is missing', `Package should be \`${this.worker.storage.nameDomain}\``))
    }

    return logs
  }
}
