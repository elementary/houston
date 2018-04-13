/**
 * houston/src/worker/preset/build.ts
 * Builds a package and edits contents for appcenter.
 */

import { Config } from '../../lib/config'
import { Repository } from '../../lib/service/base/repository'
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

function buildTasks (t: type.Type): type.ITaskConstructor[] {
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

export function Build (config: Config, repository: Repository, context: type.IContext) {
  const worker = new Worker(config, repository, context)

  for (const task of buildTasks(context.type)) {
    worker.tasks.push(task)
  }

  return worker
}
