/*
 * flightcheck/pipes/Director/index.js
 * Directs what pipes to run on flightcheck default
 *
 * @exports {Pipe} - Requires pipes based on apphub settings
 */

import Pipe from '~/flightcheck/pipes/pipe'

/*
 * Directory
 * Requires pipes based on apphub settings
 *
 * @extends Pipe
 */
export default class Directory extends Pipe {

  /**
   * code
   * Requires pipes based on apphub settings
   */
  async code () {
    const apphub = await this.require('AppHub')
  }
}
