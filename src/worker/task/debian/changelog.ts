/**
 * houston/src/worker/task/debian/changelog.ts
 * Updates, lints, and validates the Debian changelog file.
 */

import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'

import render from '../../../lib/template'
import { Log } from '../../log'
import { Change } from '../../storable'
import { Task } from '../task'

export class DebianChangelog extends Task {

  /**
   * File location for the debian changelog file
   *
   * @var {string}
   */
  public static path = 'debian/changelog'

  /**
   * Returns the full path for the debian changelog file and the current test.
   *
   * @return {String}
   */
  protected get path () {
    return path.resolve(this.worker.workspace, 'dirty', DebianChangelog.path)
  }

  /**
   * Returns the full path of the changelog template file
   *
   * @return {String}
   */
  protected get templatePath () {
    return path.resolve(__dirname, 'changelogTemplate.ejs')
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
      await this.fill()
    }

    // TODO: Lint?
  }

  /**
   * Fills the changelog file with all known changes
   * TODO: Convert markdown changes to a list
   *
   * @return {void}
   */
  public async fill () {
    await fs.ensureFile(this.path)

    if (this.worker.storage.changelog.length === 0) {
      this.worker.storage.changelog.push(this.noopChange())
    }

    const template = await fs.readFile(this.templatePath, 'utf8')
    const changelog = render(template, { storage: this.worker.storage })

    await fs.writeFile(this.path, changelog, 'utf8')
  }

  /**
   * Returns a blank change we will insert into the changelog
   *
   * @return {Object}
   */
  protected noopChange () {
    return {
      author: 'rabbitbot',
      changes: 'Version Bump',
      date: new Date(),
      version: this.worker.storage.version
    } as Change
  }
}
