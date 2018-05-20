/**
 * houston/src/lib/service/type.ts
 * A bunch of interfaces to abstract away third party services
 */

export type IStage = 'review' | 'stable'

export interface IServiceIds {
  aptlyId?: string
  githubId?: number
}

export interface IPackage extends IServiceIds {
  type: string
  path: string

  architecture?: string
  distribution?: string

  name: string
  description?: string
}

export interface ILog extends IServiceIds {
  title: string
  body?: string
}

export interface ICodeRepository {
  /**
   * The code repository URL
   *
   * @var {String}
   */
  url: string,

  /**
   * The default RDNN of the given code repository. This _can_ be changed in the
   * database, but we use _this_ string to get a sane default.
   *
   * @var {String}
   */
  rdnn: string,

  /**
   * Clones a repository of code to the given path.
   *
   * @async
   * @param {String} p Full path to clone the code to
   * @param {String} [reference] An optional reference to clone
   * @return {void}
   */
  clone: (p: string, reference?: string) => Promise<void>

  /**
   * Returns a list of references this repo has. In the case of git, this is
   * a list of full references like `refs/heads/master`
   *
   * @async
   * @return {String[]}
   */
  references: () => Promise<string[]>
}

export interface IPackageRepository {
  /**
   * Takes a full path to file and uploads it to a package repository
   *
   * @async
   * @param {IPackage} pkg The package to upload
   * @param {IStage} stage The build stage the package is in
   * @param {String} [reference] A code-repository reference that this file was from
   * @return {IPackage}
   */
  uploadPackage: (pkg: IPackage, stage: IStage, reference?: string) => Promise<IPackage>
}

export interface ILogRepository {
  /**
   * Takes a log object and uploads it to a log repository
   *
   * @async
   * @param {ILog} log The log to upload
   * @param {IStage} stage The build stage the package is in
   * @param {String} [reference] A code-repository reference that this file was from
   * @return {ILog}
   */
  uploadLog: (log: ILog, stage: IStage, reference?: string) => Promise<ILog>
}
