/**
 * flightcheck/pipes/AppData/index.js
 * Checks for a valid appdata file
 *
 * @exports {Pipe} - Checks for a valid appdata file
 */

import path from 'path'
import { spawn } from 'child_process'

import Pipe from '~/flightcheck/pipes/pipe'

/**
 * AppData
 * Checks for a valid appdata file
 *
 * @extends Pipe
 */
export default class AppData extends Pipe {

  /**
   * Creates a new Pipe
   *
   * @param {Pipeline} pipeline - Current running Pipeline
   */
  constructor (pipeline) {
    super(pipeline)
  }

  /**
   * code
   * Checks for a valid appdata file
   *
   * @param {String} p - folder holding the appdata file
   */
  async code (p = 'repository') {
    const appdataPath = path.join(p, 'data', this.pipeline.build.name+'.desktop.appdata.xml')
    const file = await this.file(appdataPath)

    if (!await file.exists()) {
      return this.log('warn', 'AppData/existance.md')
    }

    try {
      await new Promise((resolve, reject) => {
        const cmd = spawn('appstream-util', ['validate', file.path])

        let output = ''
        cmd.stdout.on('data', (data) => {
          output += data.toString()
        })

        cmd.on('close', (code) => {
          if (code !== 0) {
            reject(output)
          } else {
            resolve()
          }
        })
      })
    } catch (output) {
      return this.log('warn', 'AppData/invalid.md', output)
    }
  }
}
