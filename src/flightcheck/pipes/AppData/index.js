/**
 * flightcheck/pipes/AppData/index.js
 * Checks for a valid appdata file
 * @flow
 *
 * @exports {Pipe} - Checks for a valid appdata file
 */

import cheerio from 'cheerio'
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
      'AppDataDeveloperName',
      'AppDataProjectLicense',
      'AppDataScreenshot'
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

    const file = new Parsable(appdataAbsPath, globAbsPath, 'xml')
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
      await this.insertAppstream(file)
    }
  }

  /**
   * Writes appstream information to file
   *
   * @param {File} file - The file to write to
   * @return {void}
   */
  async insertAppstream (file: File) {
    log.debug('Saving AppCenter Stripe key')

    const raw = await file.read()
    const $ = cheerio.load(raw, { xmlMode: true })

    if ($('component > custom').length === 0) {
      $('component').append('<custom></custom>')
    }

    $('component > custom').append('<value></value>')
    const $el = $('component > custom > value:last-of-type')

    $el.attr('key', 'x-appcenter-stripe')
    $el.text(this.pipeline.build.stripe)

    await file.write($.xml())
  }
}
