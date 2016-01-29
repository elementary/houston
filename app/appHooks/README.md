# Houston appHooks

appHooks are modular files that do actions to applications. The most
common action being to test part of the code. This file contains some technical information about them.

### Overview

All appHooks are expected to be ran in parallel and return a promise of an object in the form of:
```javaScript
{
  error: ['error message strings'],
  warning: ['warning message strings']
}
```

NOTE: Use the `.update()` function instead of `.save()` for documents. This will prevent data overwrites when running functions in parallel.

### Commit function

If the file exports a function named `commit`, it will be called with an `application` object from the database whenever a repository is initialized or committed to from GitHub.
