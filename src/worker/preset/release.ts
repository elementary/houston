/**
 * houston/src/worker/preset/release.ts
 * Releases a package to all able endpoints.
 */

import { Config } from '../../lib/config'
import { ICodeRepository } from '../../lib/service'
import * as type from '../type'
import { Worker } from '../worker'

import { Appstream } from '../task/appstream'
import { BuildDeb } from '../task/build/deb'
import { DebianChangelog } from '../task/debian/changelog'
import { DebianControl } from '../task/debian/control'
import { Desktop } from '../task/desktop'
import { ExtractDeb } from '../task/extract/deb'
import { FileDeb } from '../task/file/deb'
import { PackDeb } from '../task/pack/deb'
import { WorkspaceSetup } from '../task/workspace/setup'

function releaseTasks (t: type.Type): type.ITaskConstructor[] {
  switch (t) {
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

export function Release (config: Config, repository: ICodeRepository, context: type.IContext) {
  const worker = new Worker(config, repository, context)

  for (const task of releaseTasks(context.type)) {
    worker.tasks.push(task)
  }

  return worker
}
