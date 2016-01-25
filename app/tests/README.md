# Houston tests

This file contains some technical information for test files.

### Overview

All tests are expected to be ran in parallel and return a promise of an object in the form of:
```javaScript
{
  error: ['error message strings'],
  warning: ['warning message strings']
}
```

NOTE: If you expect to save data to the database, use the `.update()` function instead of `.save()`. This will prevent data overwrites when running tests in parallel.

### Update function

Any file that exports a function named `update` will be ran on repository initialize, and on repository update. It receives an `application` object from the database. All files must be fetched from the GitHub api, as repositories are not cloned unless a release is being tested.
