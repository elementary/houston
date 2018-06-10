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

  environment: 'production',

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
      filename: '/etc/houston/database.sqlite'
    }
  },

  /**
   * The Queue configuration
   * NOTE: Currently only supports a redis backend
   *
   * @property {string} client
   *
   * @property {object} connection
   */
  queue: {
    client: 'redis',

    /**
     * Queue connection configuration.
     * Take a look at the Bull GitHub page for information
     *
     * @see https://github.com/OptimalBits/bull#basic-usage
     */
    connection: {
      host: 'localhost',
      prefix: '{queue}',
      password: '',
      port: 6379,
    }
  },

  /**
   * Docker configuration
   * This is passed to dockerode directly.
   * @see https://github.com/apocas/dockerode#getting-started
   */
  docker: {
    socketPath: '/var/run/docker.sock'
  },

  /**
   * Log configuration
   * Configures Houston log output
   * NOTE: This is an optional configuration value.
   * NOTE: Log levels are 'debug' 'info' 'warn' 'error' 'never'
   *
   * @property {string} [console] - Minimum level to output logs to console
   * @property {string} [service] - Minimum level needed to report to sentry
   */
  log: {
    console: 'debug',
    service: 'warn'
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
    },

    /**
     * GitLab configuration
     * You will need an OAuth application setup with GitLab, and an integration
     * application setup.
     *
     * @see https://docs.gitlab.com/ee/integration/oauth_provider.html
     *
     * @property {string} client - The OAuth application client key
     * @property {string} secret - The OAuth application secret key
     *
     * @property {string} installation - The installation ID
     * @property {string} key - The full path to the installation key file
     * @property {string} [hook] - The installation web hook secret.
     */
    gitlab: {
      client: 'xxxxxxxxxxxxxxxxxxxx',
      secret: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',

      installation: 0,
      key: '/etc/houston/gitlab.pem',
      hook: false
    },

    /**
     * Mandrill configuration
     * You will need a Mandrill account and email templates.
     * NOTE: This is an optional configuration value.
     *
     * @see https://mandrillapp.com/settings
     *
     * @property {string} key - Mandrill API key
     * @property {object} template - A list of template names for events
     */
    mandrill: {
      key: 'xxxxxxxxxxxxxxxxxxxxxx',

      /**
       * Mandrill template names
       *
       * @see https://mandrillapp.com/templates
       *
       * @property {string} [purchase] - Template name for an app purchase
       */
      template: {
        purchase: 'appcenter-purchase'
      }
    },

    /**
     * Sentry configuration
     * A third party error tracking service
     * NOTE: This is an optional configuration value
     *
     * @see https://docs.sentry.io/quickstart
     *
     * @property {string} [secret] - Non public sentry dsn to use for server logs
     * @property {string} [public] - A public sentry dsn to use for client logs
     */
    sentry: {
      secret: 'https://xxx:xxx@sentry.io/houston',
      public: 'https://xxx:xxx@sentry.io/houston'
    },

    /**
     * Stripe configuration
     * You will need a Stripe connect application.
     * NOTE: This is an optional configuration value.
     *
     * @see https://dashboard.stripe.com/account/applications/settings
     * @see https://dashboard.stripe.com/account/apikeys
     *
     * @property {string} client - Stripe connect client ID
     * @property {string} secret - Stripe account secret key
     * @property {string} public - Stripe account publishable key
     */
    stripe: {
      client: 'ca_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      secret: 'sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      public: 'pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    }
  }
}
