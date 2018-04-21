/**
 * houston/src/worker/task/workspace/setup.ts
 * Fills the workspace with files from git
 */

import * as fs from 'fs-extra'
import { get, set } from 'lodash'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import { Log } from '../../log'
import { Task } from '../task'

export class WorkspaceSetup extends Task {
  /**
   * Given two lists of strings we can find the first most common string.
   *
   * @param {String[]} references
   * @param {String[]} search - All of the reference parts we are looking for
   * @return {String[]}
   */
  protected static filterRefs (references, search): string[] {
    // Gets the last part of a git reference "refs/origin/master" -> "master"
    const shortReferences = references
      .map((ref) => ref.split('/').reverse()[0])

    return search
      .map((ref) => shortReferences.findIndex((short) => (short === ref)))
      .filter((ref) => (ref !== -1))
      .map((i) => references[i])
  }

  /**
   * Fills the workspace by merging the release and package branches of a repo.
   *
   * @async
   * @return {void}
   */
  public async run () {
    await this.worker.emitAsync(`task:${this.constructor.name}:start`)
    await fs.ensureDir(this.worker.workspace)

    const branches = await this.branches()

    // Step 1: Download all the needed branches
    for (let i = 0; i < branches.length; i++) {
      // TODO: Maybe go and slugify the branch for easier debugging of folders
      const gitFolder = path.resolve(this.worker.workspace, 'repository', `${i}`)
      await this.worker.repository.clone(gitFolder, branches[i])
    }

    // Step 2: Merge the downloaded branches to form a single folder
    for (let i = 0; i < branches.length; i++) {
      const from = path.resolve(this.worker.workspace, 'repository', `${i}`)
      const to = path.resolve(this.worker.workspace, 'clean')

      await fs.copy(from, to, { overwrite: true })
    }

    // Step 3: Copy pasta to the dirty directory
    const clean = path.resolve(this.worker.workspace, 'clean')
    const dirty = path.resolve(this.worker.workspace, 'dirty')

    await fs.ensureDir(clean)
    await fs.ensureDir(dirty)
    await fs.copy(clean, dirty)

    // TODO: We need to fork for every build configuration
    this.worker.context.packageSystem = 'deb'

    // Step 4: Profit
    await this.worker.emitAsync(`task:${this.constructor.name}:end`)
  }

  /**
   * Returns a list of branches to use to make the directory.
   * The given branch will always be first, followed possibly by a package branch.
   *
   * @async
   * @return {String[]}
   */
  protected async branches (): Promise<string[]> {
    const repositoryReferences = await this.worker.repository.references()

    const mergableReferences = [
      `${this.worker.context.distribution}`,
      `${this.worker.context.packageSystem}-packaging`,
      `${this.worker.context.packageSystem}-packaging-${this.worker.context.distribution}`
    ]

    if (this.worker.context.references[0] != null) {
      const shortBranch = this.worker.context.references[0].split('/').reverse()[0]
      mergableReferences.push(`${this.worker.context.packageSystem}-packaging-${this.worker.context.distribution}-${shortBranch}`)
    }

    const packageReferences = WorkspaceSetup.filterRefs(repositoryReferences, mergableReferences)

    // Returns a unique array. No dups.
    return [...new Set([...this.worker.context.references, ...packageReferences])]
  }
}
