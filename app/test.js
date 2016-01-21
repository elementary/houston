/**
 * Entry to all repository / application tests
 */
import Promise from 'bluebird';
import _ from 'lodash';

import testFiles from './tests';

// Test on update function
// Import application object
// Export promise of object with error and warning messages
export function update(application) {
  // Array of test functions
  let loadedTests = [];

  // Push all update functions to loadedTests array
  for (let file in testFiles) {
    if (typeof testFiles[file].update == 'function') {
      loadedTests.push(testFiles[file].update(application));
    }
  }

  return Promise.all(loadedTests)
  .catch(error => {
    return Promise.reject('Failed to run application tests')
  })
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

    return Promise.resolve(props)
  });
}
