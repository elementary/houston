/**
 * appHooks/icon/pre.js
 * checks for icon sizes
 *
 * @exports {Class}
 */

import AppHook from '~/appHooks/appHook'

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
