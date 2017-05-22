/**
 * config.example.js
 * An example configuration file for Houston
 */

/**
 * Houston configuration
 * All values to be used by Houston processes
 *
 * @property {string} [environment] - 'production', 'development', or 'testing'
 * @property {object} database
 * @property {object} [log]
 * @property {object} service
 */
module.exports = {

  environment: 'testing',

  /**
   * Database configuration
   *
   * @see http://knexjs.org/#Installation-node
   *
   * @property {string} client - Database client type
   *
   * @property {object} connection - Knex connection information
   */
  database: {
    client: 'sqlite3',

    /**
     * Database connection configuration
     * Configure this just like you would knex
     *
     * @see http://knexjs.org/#Installation-client
     */
    connection: {
      filename: ':memory:'
    }
  },

  /**
   * Log configuration
   * Configures Houston log output
   * NOTE: This is an optional configuration value.
   *
   * @property {string} [console] - Minimum level to output logs to console
   * @property {string} [service] - Minimum level needed to report to sentry
   */
  log: {
    console: null,
    service: null
  },

  /**
   * Service configuration
   * All third party service keys
   *
   * @property {object} aptly
   * @property {object} github
   * @property {object} [mandrill]
   * @property {object} [sentry]
   * @property {object} [stripe]
   */
  service: {

    /**
     * Aptly configuration
     * Houston uses Aptly as it's backend repository process.
     *
     * @property {string} url - Api endpoint for Aptly
     * @property {string} [passphrase] - GPG passphrase for publishing
     *
     * @property {string} review - Name of the review repository
     * @property {string} stable - Name of the stable repository
     */
    aptly: {
      url: 'http://localhost:8080/api',
      passphrase: 'xxxxxxxxxxxxxxxx',

      review: 'review',
      stable: 'appcenter'
    },

    /**
     * GitHub configuration
     * You will need an OAuth application setup with GitHub, and an integration
     * application setup.
     *
     * @see https://github.com/settings/developers
     * @see https://github.com/settings/integrations
     *
     * @property {string} client - The OAuth application client key
     * @property {string} secret - The OAuth application secret key
     *
     * @property {string} installation - The installation ID
     * @property {string} key - The full path to the installation key file
     * @property {string} [hook] - The installation web hook secret.
     */
    github: {
      client: 'xxxxxxxxxxxxxxxxxxxx',
      secret: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',

      installation: 0,
      key: '/etc/houston/github.pem',
      hook: false
    }
  }
}
