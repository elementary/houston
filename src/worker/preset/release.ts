/**
 * houston/src/worker/preset/release.ts
 * Releases a package to all able endpoints.
 */

import { App } from '../../lib/app'
import { ICodeRepository } from '../../lib/service'
import * as type from '../type'

import { Build } from './build'

import { Upload } from '../task/upload'

export function Release (app: App, repository: ICodeRepository, context: type.IContext): type.IWorker {
  const worker = Build(app, repository, context)

  worker.postTasks.push(Upload)

  return worker
}
