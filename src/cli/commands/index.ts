/**
 * houston/src/cli/commands/index.ts
 * Exports an array of all the commands we can run.
 */

export default [
  require('./build'),
  require('./migrate'),
  require('./repo'),
  require('./seed'),
  require('./version')
]
