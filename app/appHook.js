/**
 * Entry to all repository / application hooks
 */
import Promise from 'bluebird';

import app from '~/'
import files from './appHooks';

// Test an application at a given time
// Import level (commit, pre-build, post-build) and application object
// Export promise of object with error and warning messages
const test = function(level = 'commit', application) {
  // Array of test functions
  const tests = files
  .filter(file => typeof file[level] === 'function')
  .map(file => file[level](application));

  app.log.silly(`Running ${tests.length} ${level} hooks on ${application.github.fullName}`);

  return Promise.all(tests)
  .then(messages => { // Consolidate and sort the returned array of objects
    const props = {
      error: messages.map(message => message.error).filter(str => str != '').sort(),
      warning: messages.map(message => message.warning).filter(str => str != '').sort(),
    }

    // Make the log messages look nice
    const errorString = (props.error.length === 1) ? 'error' : 'errors';
    const warnString = (props.warning.length === 1) ? 'warning' : 'warnings';

    app.log.silly(`${application.github.fullName} has ${props.error.length} ${errorString} and ${props.warning.length} ${warnString}`);

    // Return the problems
    return Promise.resolve(props)
  });
}

export default {
  test,
}
