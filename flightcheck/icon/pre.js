/**
 * flightcheck/icon/pre.js
 * Checks for icon sizes
 *
 * @exports {Class} - AppHook class for chacking icon sizes
 */

import AppHook from '~/flightcheck/appHook'

class Icon extends AppHook {
  constructor (data) {
    super(data, {
      name: 'icon',
      post: true
    })
  }

  async test () {
    const icon = await this.file(`icons/64/${this.data.project.name}.svg`)

    if (icon == null) {
      this.error(64)
      return
    }

    this.update({package: {icon}})

    return
  }

}

export default Icon
