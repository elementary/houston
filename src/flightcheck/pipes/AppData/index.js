/**
 * flightcheck/pipes/AppData/index.js
 * Checks for a valid appdata file
 * @flow
 *
 * @exports {Pipe} - Checks for a valid appdata file
 */

import path from 'path'

import File from 'flightcheck/file'
import Log from 'lib/log'
import Parsable from 'flightcheck/file/parsable'
import Pipe from 'flightcheck/pipes/pipe'

const log = new Log('flightcheck:AppData')

/**
 * AppData
 * Checks for a valid appdata file
 *
 * @extends Pipe
 */
export default class AppData extends Pipe {

  /**
   * A list of AppData tests to run.
   *
   * @return {String[]}
   */
  tests () {
    return [
      'AppDataChangelog',
      'AppDataId',
      'AppDataDeveloperName'
    ]
  }

  /**
   * code
   * Checks for a valid appdata file
   *
   * @param {String} [p] - folder holding the appdata file
   * @returns {Void}
   */
  async code (p: string = 'repository/data') {
    const appdataName = `${this.pipeline.build.name}.appdata.xml`
    const globName = '**/*appdata*xml'

    const appdataPath = path.join(p, appdataName)
    const globPath = path.join(p, globName)

    const appdataAbsPath = path.join(this.pipeline.build.dir, appdataPath)
    const globAbsPath = path.join(this.pipeline.build.dir, globPath)

    const file = new Parsable(appdataAbsPath, globAbsPath)
    const fileFound = await file.exists()

    if (fileFound == null) {
      return this.log('error', 'AppData/existance.md', appdataName)
    }

    const filePath = path.relative(this.pipeline.build.dir, fileFound)
    const returned = await this.docker('util', ['validate', filePath, '--no-color'])

    if (returned.exit !== 0) {
      try {
        const file = new File(path.resolve(this.pipeline.build.dir, returned.log))
        const log = await file.read()

        const type = (log.indexOf('errors: ') !== -1) ? 'error' : 'warn'

        await this.log(type, 'AppData/invalid.md', log, false)

        if (type === 'error') return
      } catch (e) {
        log.debug('Unable to fetch log of failed AppData validation')
        log.debug(e)

        return this.log('error', 'AppData/invalid.md')
      }
    }

    await Promise.all(this.tests().map((test) => this.require(test, file)))

    if (this.pipeline.build.stripe != null) {
      log.debug('Saving AppCenter Stripe key')

      const returned = await this.docker('stripe', [appdataPath, this.pipeline.build.stripe], undefined, {
        Privileged: true // because the unpacked package has root file permissions
      })

      if (returned.exit !== 0) {
        await this.log('error', 'AppData/stripe.md')
      }
    }
  }
}
