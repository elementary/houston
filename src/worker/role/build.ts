/**
 * houston/src/worker/role/build.ts
 * Builds a package and edits contents for appcenter.
 *
 * @export {Role} Build
 */

import { Role } from './role'

export class Build extends Role {
  /**
   * Tasks to run before building
   *
   * @var {Task[]}
   */
  public prebuild = []

  /**
   * Tasks to run for building
   *
   * @var {Task[]}
   */
  public build = [

  ]

  /**
   * Tasks to run before testing
   *
   * @var {Task[]}
   */
  public pretest = []

  /**
   * Tasks to run for testing
   *
   * @var {Task[]}
   */
  public test = []

  /**
   * Tasks to run after testing
   *
   * @var {Task[]}
   */
  public posttest = []
}
