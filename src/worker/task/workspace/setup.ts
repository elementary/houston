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
import { IWorker } from '../../type'
import { Task } from '../task'

interface IBuildConfiguration {
  architecture: string,
  distribution: string,
  packageType: string
}

export class WorkspaceSetup extends Task {
  /**
   * These are all possible types of outputs we can have. They are used for
   * generating possible reference names.
   *
   * @var {String[]}
   */
  protected possiblePackageTypes = ['deb']
  protected possibleArchitectures = ['amd64']
  protected possibleDistributions = ['loki', 'juno']

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
    await this.worker.emitAsync(`task:WorkspaceSetup:start`)

    const builds = await this.possibleBuilds()

    if (builds.length === 0) {
      builds.push({
        architecture: 'amd64',
        distribution: 'loki',
        packageType: 'deb'
      })
    }

    for (const build of builds) {
      const worker = await this.worker.emitAsyncChain<IWorker>(
        `task:WorkspaceSetup:fork`,
        await this.worker.fork({
          architecture: build.architecture,
          distribution: build.distribution,
          package: { type: build.packageType }
        })
      )

      await fs.ensureDir(worker.workspace)
      const branches = await this.branches(build)

      // Step 1: Download all the needed branches
      for (let i = 0; i < branches.length; i++) {
        // TODO: Maybe go and slugify the branch for easier debugging of folders
        const gitFolder = path.resolve(worker.workspace, 'repository', `${i}`)
        await worker.repository.clone(gitFolder, branches[i])
      }

      // Step 2: Merge the downloaded branches to form a single folder
      for (let i = 0; i < branches.length; i++) {
        const from = path.resolve(worker.workspace, 'repository', `${i}`)
        const to = path.resolve(worker.workspace, 'clean')

        await fs.copy(from, to, { overwrite: true })
      }

      // Step 3: Copy pasta to the dirty directory
      const clean = path.resolve(worker.workspace, 'clean')
      const dirty = path.resolve(worker.workspace, 'dirty')

      await fs.ensureDir(clean)
      await fs.ensureDir(dirty)
      await fs.copy(clean, dirty)
    }

    // Step 4: Profit
    await this.worker.emitAsync(`task:WorkspaceSetup:end`)
  }

  /**
   * Using all the possible combinations and repositories references we have,
   * this will generate a list of each package system, architecture, and
   * distribution we should build for.
   *
   * @async
   * @return {IBuildConfiguration[]}
   */
  private async possibleBuilds (): Promise<IBuildConfiguration[]> {
    const repositoryReferences = await this.worker.repository.references()
    const buildConfigurations: IBuildConfiguration[] = []

    for (const packageType of this.possiblePackageTypes) {
      for (const architecture of this.possibleArchitectures) {
        for (const distribution of this.possibleDistributions) {
          const possibleReferences = [
            `${distribution}`,
            `${packageType}-packaging`,
            `${packageType}-packaging-${distribution}`
          ]

          const matchingRefs = WorkspaceSetup.filterRefs(repositoryReferences, possibleReferences)

          if (matchingRefs.length !== 0) {
            buildConfigurations.push({
              architecture,
              distribution,
              packageType
            })
          }
        }
      }
    }

    return buildConfigurations
  }

  /**
   * Returns a list of branches to use for making the build.
   *
   * @async
   * @param {IBuildConfiguration} build
   * @return {String[]}
   */
  private async branches (build: IBuildConfiguration): Promise<string[]> {
    const repositoryReferences = await this.worker.repository.references()

    const mergableReferences = [
      `${build.distribution}`,
      `${build.packageType}-packaging`,
      `${build.packageType}-packaging-${build.distribution}`
    ]

    if (this.worker.context.references[0] != null) {
      const shortBranch = this.worker.context.references[0].split('/').reverse()[0]
      mergableReferences.push(`${build.packageType}-packaging-${build.distribution}-${shortBranch}`)
    }

    const packageReferences = WorkspaceSetup.filterRefs(repositoryReferences, mergableReferences)

    // Returns a unique array. No dups.
    return [...new Set([...this.worker.context.references, ...packageReferences])]
  }
}
