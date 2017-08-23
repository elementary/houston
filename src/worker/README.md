# houston/src/worker/

This folder holds all the logic for testing, building, and fixing projects. If
something goes wrong when building your project, it's probably because of code
in this folder.

## worker.ts

This class holds the basic information about any task we do. It holds the
repository, working directory, and logs.

## role/

These holds the different types of work we can do. They are mainly for putting
together tasks in an easy to understand result, like building or publishing a
project.

## task/

These are the most basic of tasks we can do. They only do one thing, and are
very easy to test. Examples include parsing the apphub file, publishing a
package to github, and building a deb package.

## The build directory

Every build gets its own unique folder in the OS temporary folder. In most Linux
system this ends up being `/tmp/houston`. It then has a UUID generated folder to
hold the process workspace. If all tasks where ran, the workspace would end up
looking similar to this
```
/tmp/houston/ad1553ea-7a27-44cd-8eb7-66540c4ad77c/
├── clean/ # Untouched cloned repository
├── dirty/ # All of the edited files
└── working/ # Folders for our currently running tasks
    └── (uuid)/ # A random generated folder name for a currently running task
```
