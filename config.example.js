module.exports = {

  // Mongoose connection
  database: {
    url: 'mongodb://localhost/houston-dev',
  },

  // Github access
  // https://github.com/settings/developers
  github: {
    clientID: '12345679101112131415',
    secret: '1234567891011121314151617181920212223242',
    // Github authentication callback url. Don't change '/auth/github/callback'
    callback: 'http://localhost:3000/auth/github/callback',
  },

  // Jenkins hook
  jenkins: {
    enabled: false,
    url: 'http://john:1234@jenkins.elementaryos.org',
    // Jenkins job for building deb files
    job: 'deb-new-test',
    // Jenkins access secret
    secret: 'test',
  },

  // App logging
  log: {
    // Create 'error.log' and 'info.log' files?
    files: false,
    // Log on console?
    console: true,
    // Log level for console? 'silly' 'debug' 'verbose' 'info' 'warn' 'error'
    level: 'debug',
  },

  // Web server
  server: {
    port: 3000,
    // Express session secret
    secret: 'LearntocodeCreatethefuture',
  },

  // User permissions
  rights: {
    // Allows bypassing of all right checking. Useful for development.
    enabled: false,
    // Github team ids for admin, and reviewer permissions.
    // https://developer.github.com/v3/orgs/teams/#get-team
    admin: 213128,
    reviewer: 1880652,
    // Github organization name for beta permission.
    org: 'elementary',
  },

}
