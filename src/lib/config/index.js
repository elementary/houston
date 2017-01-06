/**
 * lib/config/index.js
 * Holds the global application configuration. Loaded by files that need config.
 * Set by CLI entry file before files are executed
 *
 * @exports {Class} default - a Config class to use in application
 */

import Config from './class'

export default new Config()
