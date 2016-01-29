/**
 * Entry to all repository / application tests
 */
import Promise from 'bluebird';
import _ from 'lodash';

import app from '~/'
import testFiles from './tests';

// Test on update function
// Import application object
// Export promise of object with error and warning messages
export function update(application) {
  // Array of test functions
  let loadedTests = [];

  // Push all update functions to loadedTests array
  for (let file in testFiles) {
    if (typeof testFiles[file].update === 'function') {
      loadedTests.push(testFiles[file].update(application));
    }
  }

  app.log.silly(`Running ${loadedTests.length} update tests on ${application.github.fullName}`);

  return Promise.all(loadedTests)
  .then(messages => { // Consolidate and sort the returned array of objects
    let props = {
      error: [],
      warning: [],
    }

    for (let i = 0; i < messages.length; i++) {
      props.error.push(messages[i].error)
      props.warning.push(messages[i].warning)
    }

    props.error = _.flattenDeep(props.error).sort()
    props.warning = _.flattenDeep(props.warning).sort()

    // Make the log messages look nice
    const errorString = (props.error.length === 1) ? 'error' : 'errors';
    const warnString = (props.warning.length === 1) ? 'warning' : 'warnings';

    app.log.silly(`${application.github.fullName} has ${props.error.length} ${errorString} and ${props.warning.length} ${warnString}`);

    // Return the problems
    return Promise.resolve(props)
  });
}
