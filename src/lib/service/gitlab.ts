/**
 * houston/src/lib/service/gitlab.ts
 * Handles interaction with GitLab repositories.
 */

import * as URL from 'url'

import * as fileType from 'file-type'
import * as fs from 'fs-extra'
import { injectable } from 'inversify'
import * as Git from 'nodegit'
import * as os from 'os'
import * as path from 'path'
import * as agent from 'superagent'
import * as uuid from 'uuid/v4'

import { sanitize } from '../utility/rdnn'
import * as type from './type'

@injectable()
export class GitLab implements type.ICodeRepository, type.IPackageRepository, type.ILogRepository {
  /**
   * tmpFolder
   * Folder to use as scratch space for cloning repos
   *
   * @var {string}
   */
  protected static tmpFolder = path.resolve(os.tmpdir(), 'houston')

  /**
   * The human readable name of the service.
   *
   * @var {String}
   */
  public serviceName = 'GitLab'

  /**
   * username
   * The GitLab username or organization.
   *
   * @var {string}
   */
  public username: string

  /**
   * repository
   * The GitLab user's repository name
   *
   * @var {string}
   */
  public repository: string

  /**
   * auth
   * Authentication to use when interacting
   *
   * @var {string}
   */
  public auth?: string

  /**
   * reference
   * The reference to branch or tag.
   *
   * @var {string}
   */
  public reference = 'refs/heads/master'

  /**
   * Tries to get the file mime type by reading the first chunk of a file.
   * Required by GitLab API
   *
   * Code taken from examples of:
   * https://github.com/sindresorhus/file-type
   * https://github.com/sindresorhus/read-chunk/blob/master/index.js
   *
   * @async
   * @param {String} p Full file path
   * @return {String} The file mime type
   */
  protected static async getFileType (p: string): Promise<string> {
    const buffer = await new Promise((resolve, reject) => {
      fs.open(p, 'r', (openErr, fd) => {
        if (openErr != null) {
          return reject(openErr)
        }

        fs.read(fd, Buffer.alloc(4100), 0, 4100, 0, (readErr, bytesRead, buff) => {
          fs.close(fd)

          if (readErr != null) {
            return reject(readErr)
          }

          if (bytesRead < 4100) {
            return resolve(buff.slice(0, bytesRead))
          } else {
            return resolve(buff)
          }
        })
      })
    })

    return fileType(buffer).mime
  }

  /**
   * Creates a new GitLab Repository
   *
   * @param {string} url - The full gitlab url
   */
  constructor (url: string) {
    this.url = url
  }

  /**
   * url
   * Returns the Git URL for the repository
   *
   * @return {string}
   */
  public get url (): string {
    if (this.auth != null) {
      return `https://x-access-token:${this.auth}@gitlab.com/${this.username}/${this.repository}.git`
    }

    return `https://gitlab.com/${this.username}/${this.repository}.git`
  }

  /**
   * url
   * Sets the Git URL for the repository
   * NOTE: Auth code is case sensitive, so we can't lowercase the whole url
   *
   * @return {string}
   */
  public set url (p: string) {
    if (p.indexOf('gitlab') === -1) {
      throw new Error('Given URL is not a GitLab repository')
    }

    // NOTE: This is A+ 10/10 string logic. Will not break ever.
    const httpPath = (p.startsWith('git@') ? p.replace('git@', 'https://') : p)
      .replace('://gitlab.com:', '://gitlab.com/')
      .replace(/\.git$/, '')

    const url = new URL.URL(httpPath)
    const [, username, repository] = url.pathname.split('/')

    this.username = username
    this.repository = repository
    this.auth = url.password || url.username || null
  }

  /**
   * Returns the default RDNN value for this repository
   *
   * @return {string}
   */
  public get rdnn () {
    return sanitize(`com.gitlab.${this.username}.${this.repository}`)
  }

  /**
   * clone
   * Clones the repository to a folder
   *
   * @async
   * @param {string} p - The path to clone to
   * @param {string} [reference] - The branch to clone
   * @return {void}
   */
  public async clone (p: string, reference = this.reference): Promise<void> {
    const repo = await Git.Clone(this.url, p)
    const ref = await Git.Reference.lookup(repo, reference)

    await repo.checkoutRef(ref)

    await fs.remove(path.resolve(p, '.git'))
  }

  /**
   * references
   * Returns a list of references this repository has
   * TODO: Try to figure out a more optimized way
   *
   * @async
   * @return {string[]}
   */
  public async references (): Promise<string[]> {
    const p = path.resolve(GitLab.tmpFolder, uuid())
    const repo = await Git.Clone(this.url, p)

    const branches = await repo.getReferenceNames(Git.Reference.TYPE.LISTALL)

    await fs.remove(p)

    return branches
  }

  // TODO: Implement uploadPackage when the GitLab API becomes avaliable

  /**
   * Uploads a log to GitLab as an issue with the 'AppCenter' label
   *
   * @async
   * @param {ILog} log
   * @param {IStage} stage
   * @param {string} [reference]
   * @return {ILog}
   */
  public async uploadLog (log: type.ILog, stage: type.IStage, reference?: string): Promise<type.ILog> {
    if (log.gitlabId != null) {
      return
    }

    const hasLabel = await agent
      .get(`https://gitlab.com/api/v4/projects/${this.username}%2F${this.repository}/labels`)
      .set('authorization', `Bearer ${this.auth}`)
      .then((res) => {
          return res.body.map((label) => label.name).indexOf('AppCenter') >= 0
      })

    if (!hasLabel) {
      await agent
        .post(`https://gitlab.com/api/v4/projects/${this.username}%2F${this.repository}/labels`)
        .set('authorization', `Bearer ${this.auth}`)
        .send({
          color: '#4c158a',
          description: 'Issues related to releasing on AppCenter',
          name: 'AppCenter'
        })
    }

    const { body } = await agent
      .post(`https://gitlab.com/api/v4/projects/${this.username}%2F${this.repository}/issues`)
      .set('authorization', `Bearer ${this.auth}`)
      .send({
        description: log.body,
        labels: 'AppCenter',
        title: log.title
      })

    return { ...log, gitlabId: body.id }
  }
}
