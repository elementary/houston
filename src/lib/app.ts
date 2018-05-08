/**
 * houston/src/lib/app.ts
 * IOC container for houston. This is the entrypoint to anything and everything
 * sweat in life.
 */

import { Container, ContainerModule } from 'inversify'

import { Config } from './config'

/**
 * App
 * A houston IOC container
 */
export class App extends Container {

  /**
   * A list of all the providers to load in the application.
   *
   * @var {ContainerModule[]}
   */
  protected static providers: ContainerModule[] = [
    require('../repo/provider').provider,
    require('../worker/provider').provider,
    require('./database/provider').provider,
    require('./log/provider').provider,
    require('./queue/provider').provider,
    require('./server/provider').provider,
    require('./service/provider').provider,
    require('./utility/faker/provider').provider
  ]

  /**
   * Creates a new App
   *
   * @param {Config} config
   */
  public constructor (config: Config) {
    super()

    this.bind<Config>(Config).toConstantValue(config)

    this.setupProviders()
  }

  /**
   * Sets up all of the providers we have throughout the application.
   *
   * @return {void}
   */
  public setupProviders () {
    this.load(...App.providers)
  }
}
