/**
 * houston/src/lib/service/github/repository.ts
 * Handles interaction with GitHub repositories.
 *
 * @return {class} Repository - A GitHub repository class
 */

import * as Git from 'simple-git'

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
   * reference
   * The reference to branch or tag.
   *
   * @var {string}
   */
  public reference = 'refs/heads/master'

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
   * @param {string} [reference] - The branch to clone
   * @return {void}
   */
  public async clone (p: string, reference = this.reference): Promise<void> {
    await Git(p)
      .silent(false)
      .clone(this.url, p, ['--depth', 1])
      .exec()

    await Git(p)
      .silent(false)
      .checkout(reference)
      .exec()
  }
}
