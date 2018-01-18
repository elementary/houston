/**
 * houston/src/worker/role/build.ts
 * Builds a package and edits contents for appcenter.
 *
 * @export {Role} Build
 */

import { Role } from './role'

export class Build extends Role {
  /**
   * Tasks to run for building an application
   *
   * @var {Task[]}
   */
  public tasks = [
    require('../task/workspace/setup').Setup,
    require('../task/debian/changelog').DebianChangelog,
    require('../task/debian/control').DebianControl,
    require('../task/build/deb').BuildDeb,
    require('../task/extract/deb').ExtractDeb,
    require('../task/binary/exist').BinaryExist
  ]
}
