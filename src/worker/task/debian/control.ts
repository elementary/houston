/**
 * houston/src/worker/task/debian/control.ts
 * Updates, lints, and validates the Debian control file.
 */

import * as fs from 'fs-extra'
import { get, set } from 'lodash'
import * as os from 'os'
import * as path from 'path'

import { Log } from '../../log'
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

    const logs = (this.lint(data) || [])
    const highestLogs = logs.sort((a, b) => (b.level - a.level))

    if (highestLogs.length > 0) {
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
  protected fill (data: object): void {
    // Required fields by Debian law
    this.deepFill(data, 'Source', this.worker.storage.nameAppstream)
    this.deepFill(data, 'Maintainer', `${this.worker.storage.nameDeveloper} <appcenter@elementary.io>`)
    this.deepFill(data, 'Package', this.worker.storage.nameDomain)

    // Extra optional fun stuff
    this.deepFill(data, 'Priority', 'optional')
    this.deepFill(data, 'Standards-Version', this.worker.storage.version)
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

    this.deepAssert(logs, data, 'Source', this.worker.storage.nameAppstream, `Source should be \`${this.worker.storage.nameAppstream}\``)

    this.deepAssert(logs, data, 'Maintainer', null, 'Missing maintainer')
    this.deepAssert(logs, data, 'Maintainer', /^.*\s<.*>$/, 'Maintainer should be in the form of `Maintainer Name <maintainer@email.com>`')

    this.deepAssert(logs, data, 'Package', this.worker.storage.nameDomain, `Package should be \`${this.worker.storage.nameDomain}\``)

    return logs
  }

  /**
   * Inserts value into object it it does not yet exist
   *
   * @param {Object} data
   * @param {String} key
   * @param {String|Number} value
   * @return {void}
   */
  protected deepFill (data: object, key: string, value: string|number): void {
    if (get(data, key) == null) {
      set(data, key, value)
    }

    return
  }

  /**
   * Asserts a deep value in the debian control file
   *
   * @param {Log[]} logs
   * @param {Object} data
   * @param {String} key
   * @param {String|Number|RegExp|Function|null} value
   * @param {String} [error]
   * @return {void}
   */
  protected deepAssert (logs: Log[], data: object, key: string, value, error = `Assert of ${key} failed`): void {
    const d = get(data, key)

    let failed = false

    if (typeof value === 'string' || typeof value === 'number') {
      failed = (d !== value)
    } else if (value instanceof RegExp) {
      failed = !value.test(d)
    } else if (typeof value === 'function') {
      failed = !value(d)
    } else if (value == null) {
      failed = (d == null)
    } else {
      throw new Error(`Unknown deepAssert value for "${value}"`)
    }

    if (failed) {
      const log = new Log(Log.Level.ERROR, 'Debian control linting failed', error)
        .workable(this)

      logs.push(log)
    }
  }
}
