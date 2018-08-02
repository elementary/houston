/**
 * houston/src/lib/service/aptly/package-repo.ts
 * Class for aptly package stuff
 */

import * as crypto from 'crypto'
import { inject, injectable } from 'inversify'
import * as agent from 'superagent'

import { Config } from '../config'
import { Logger } from '../log'
import * as type from './type'

/**
 * This is an array of architectures we will publish to if we don't have any
 * given in the configuration.
 *
 * @var {String[]}
 */
const DEFAULT_ARCHITECTURES = ['amd64']

/**
 * This is the default distribution we will publish for if non is given
 *
 * @var {String}
 */
const DEFAULT_DISTRIBUTION = 'xenial'

// These are the settings we get when publishing
export interface IAptlyDetails {
  prefix?: string
  distribution: string
  architectures: string[]
}

/**
 * Creates a url from the strings given fixing weird undefined errors.
 *
 * @param {...String} args
 * @return {String}
 */
export function createUrl (...args) {
  return args
    .filter((arg) => (arg != null && arg !== undefined))
    .join('/')
    .replace(/(?<!:)\/{2,}/, '/')
}

@injectable()
export class Aptly implements type.IPackageRepository {
  /**
   * The human readable name of the service.
   *
   * @var {String}
   */
  public serviceName = 'elementary Package Repository'

  /**
   * The application configuration
   *
   * @var {Config}
   */
  protected config: Config

  /**
   * A logger for the Aptly third party service
   *
   * @var {Logger}
   */
  protected logger: Logger

  /**
   * Creates a new aptly package repository
   *
   * @param {Config} config
   */
  constructor (@inject(Config) config: Config, @inject(Logger) logger: Logger) {
    this.config = config
    this.logger = logger
  }

  /**
   * Takes a full path to file and uploads it to a package repository
   *
   * @async
   * @param {IPackage} pkg The package to upload
   * @param {IStage} [stage] The build stage the package is in
   * @param {String} [reference] A code-repository reference that this file was from
   * @return {IPackage} Package with an updated aptly id
   */
  public async uploadPackage (pkg: type.IPackage, stage?: type.IStage, reference?: string) {
    const rootUrl = this.config.get('service.aptly.url')
    const details = this.getAptlyDetails(pkg, stage)

    if (pkg.aptlyId == null) {
      // Some background here: We need this to be unique to each package for
      // Testing reasons (matching nock request urls), but we want it to be
      // Random enough that we will not get collisions. This does not need to be
      // Secure for any reasons.
      const fileHash = crypto
        .createHash('md5')
        .update(JSON.stringify(pkg))
        .digest('hex')
        .substring(6)
      const filePkgName = pkg.name.toLowerCase().replace(/[^0-9a-z-]/gi, '')
      const fileName = `${filePkgName}-${fileHash}.${pkg.type}`

      await agent
        .post(createUrl(rootUrl, 'files', fileName))
        .attach('file', pkg.path, fileName)

      const aptlyFileName = await agent
        .post(createUrl(rootUrl, 'repos', details.prefix, 'file', fileName))
        .then((data) => {
          if (data.body.FailedFiles != null && data.body.FailedFiles.length > 0) {
            throw new Error('Unable to add package to Aptly')
          } else {
            // Aptly adds an ' added' string
            return data.body.Report.Added[0].split(' ')[0]
          }
        })

      // Aptly requires us to do _yet another_ API call to get the package ID :/
      pkg.aptlyId = await agent
        .get(createUrl(rootUrl, 'repos', details.prefix, 'packages'))
        .query({ q: aptlyFileName })
        .then((data) => {
          if (data.body == null || data.body.length < 1) {
            throw new Error('Unable to find uploaded Aptly package')
          } else {
            return data.body[0]
          }
        })

      await agent.delete(createUrl(rootUrl, 'files', fileName))
    }

    await agent
      .post(createUrl(rootUrl, 'repos', details.prefix, 'packages'))
      .send({ PackageRefs: [pkg.aptlyId] })

    return pkg
  }

  /**
   * Resolves all the details aptly needs to publish
   *
   * @param {IPackage} pkg
   * @param {IStage} stage
   * @return {IAptlyDetails}
   */
  public getAptlyDetails (pkg: type.IPackage, stage: type.IStage): IAptlyDetails {
    const resolveFn = (value) => {
      const defaultValue = {
        architectures: ((value || {}).architectures || DEFAULT_ARCHITECTURES),
        distribution: ((value || {}).distribution || pkg.distribution || DEFAULT_DISTRIBUTION),
        prefix: (value || {}).prefix
      }

      switch (typeof value) {
        case ('string'):
          return { ...defaultValue, prefix: value }
        case ('function'):
          return resolveFn(value(pkg))
        case ('object'):
        case ('undefined'):
          return defaultValue
        default:
          throw new Error('Aptly settings returned unknown value.')
      }
    }

    return resolveFn(this.config.get(`service.aptly.${stage}`))
  }
}
