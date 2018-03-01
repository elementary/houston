/**
 * houston/src/worker/role/build.ts
 * Builds a package and edits contents for appcenter.
 *
 * @export {Role} Build
 */

import { Role } from './role'

import { Appstream } from '../task/appstream'
import { BuildDeb } from '../task/build/deb'
import { DebianChangelog } from '../task/debian/changelog'
import { DebianControl } from '../task/debian/control'
import { Desktop } from '../task/desktop'
import { ExtractDeb } from '../task/extract/deb'
import { FileDeb } from '../task/file/deb'
import { PackDeb } from '../task/pack/deb'
import { WorkspaceSetup } from '../task/workspace/setup'

export class Build extends Role {
  /**
   * Tasks to run for building an application
   *
   * @var {WorkableConstructor[]}
   */
  public get tasks () {
    switch (this.worker.storage.type) {
      case 'library':
        return [
          WorkspaceSetup,
          DebianChangelog,
          DebianControl,
          BuildDeb
        ]
      default:
        return [
          WorkspaceSetup,
          DebianChangelog,
          DebianControl,
          BuildDeb,
          ExtractDeb,
          FileDeb,
          Appstream,
          Desktop,
          PackDeb
        ]
    }
  }

  /**
   * A setter for tasks to make typescript happy.
   *
   * @param {WorkableConstructor[]} v
   * @return {void}
   */
  public set tasks (v) {
    return
  }
}
