# houston/src/process/

This folder holds all the logic for testing, building, and fixing projects. If
something goes wrong when building your project, it's probably because of code
in this folder.

## process.ts

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
