/**
 * houston/src/lib/utility/faker/index.ts
 * Creates fake data. Used for testing and factories
 */

import * as BaseFaker from 'faker/lib/index'
import * as Random from 'faker/lib/random'
import * as locale from 'faker/locale/en'
import { injectable, multiInject } from 'inversify'

import { fakerProvider, FakerProvider } from './type'

@injectable()
export class Faker extends BaseFaker {

  public locale: string

  /**
   * Creates a new new Faker instance
   *
   * @param {FakerProvider[]} [providers]
   */
  constructor (@multiInject(fakerProvider) providers: FakerProvider[] = []) {
    super({
      locale: 'en',
      locales: [{ en: locale }]
    })

    providers.forEach((provider) => {
      this.registerProvider(provider)
    })
  }

  protected registerProvider (provider: FakerProvider) {
    const p = provider(this)

    // TODO: Allow extending Faker with more providers
  }

}
