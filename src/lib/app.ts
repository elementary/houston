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
   * @var ContainerModule[]
   */
  public static providers: ContainerModule[] = [
    require('./log/provider').provider
  ]

  /**
   * Creates a new App
   *
   * @param Config config
   */
  public constructor (config: Config) {
    super()

    this.bind<App>(App).toConstantValue(this)
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
