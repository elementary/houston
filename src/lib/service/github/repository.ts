/**
 * houston/src/lib/service/github/repository.ts
 * Handles interaction with GitHub repositories.
 *
 * @return {class} Repository - A GitHub repository class
 */

import * as Git from 'nodegit'

import { Repository as RepositoryInterface } from '../base/repository'

export class Repository implements RepositoryInterface {

  /**
   * username
   * The GitHub username or organization.
   *
   * @var {string}
   */
  public username: string

  /**
   * repository
   * The GitHub user's repository name
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
   * branch
   * The default branch in the repository. 99% of the time it's master.
   *
   * @var {string}
   */
  public branch = 'master'

  /**
   * Creates a new GitHub Repository
   *
   * @param {string} username - The GitHub username or organization
   * @param {string} repository - The GitHub user's repository name
   * @param {string} [auth] - AUthentication to use when interacting
   */
  constructor (username: string, repository: string, auth?: string) {
    this.username = username
    this.repository = repository
    this.auth = auth
  }

  /**
   * url
   * Returns the Git URL for the repository
   *
   * @return {string}
   */
  public get url (): string {
    if (this.auth != null) {
      return `https://${this.auth}@github.com/${this.username}/${this.repository}.git`
    }

    return `https://github.com/${this.username}/${this.repository}.git`
  }

  /**
   * url
   * Sets the Git URL for the repository
   * NOTE: Auth code is case sensitive, so we can't lowercase the whole url
   *
   * @return {string}
   */
  public set url (p: string) {
    if (p.indexOf('github') === -1) {
      throw new Error('Given URL is not a GitHub repository')
    }

    const chunks = p.split(/[@\/:\.]/)
    const reverseChunks = [...chunks].reverse()

    if (reverseChunks[0].toLowerCase() === 'git') {
      this.username = reverseChunks[2]
      this.repository = reverseChunks[1]
    } else {
      this.username = reverseChunks[1]
      this.repository = reverseChunks[0]
    }

    if (chunks[0].toLowerCase() === 'https' || chunks[0].toLowerCase() === 'http') {
      if (chunks[3].toLowerCase() !== 'github') {
        this.auth = chunks[3]
      }
    }
  }

  /**
   * clone
   * Clones the repository to a folder
   *
   * @async
   * @param {string} p - The path to clone to
   * @param {string} [branch] - The branch to clone
   * @return {void}
   */
  public async clone (p: string, branch = this.branch): Promise<void> {
    const repo = await Git.Clone(this.url, p)

    // TODO: checkout branch and verify

    return
  }
}
