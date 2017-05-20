# houston/src/lib/database/

This folder holds all of the database logic. Everything is making use of
[knex](http://knexjs.org), so we recommend you read up a bit on that.

## Tables

These are all the current tables we have:

- `projects`
- `releases`
- `builds`
- `build_logs`
- `build_issues`
- `packages`

- `github_projects`
- `github_releases`
- `github_build_issues`

## Database Design

The main tables can be described like this:
```
projects -> 1:n -> releases -> 1:n -> builds -> 1:n -> packages
```

The `projects`, `releases`, and `build_issues` tables have a polymorphic
relationship to a service table like `github_projects`. This allows us to
integrate other third party services easier, and without changing existing data.

## Seeds

The seed folder contains a bunch of helpful seeds designed to be used in tests
and for development. Here is the lodown for how they are setup.

### Projects

Keymaker
- 3 Releases
- 1 Build
- 4 Build logs
- 1 Package

AppCenter
- 8 Releases (2 invalid)
- 3 Builds
- 2 Build logs
- 3 Packages

Code
- 1 Release (1 invalid)
- 0 Builds
- 0 build logs
- 0 Packages

Terminal
- 2 Releases
- 2 Builds
- 3 Build logs
- 1 Package

### Users

The seed files include multiple users, each one representing a different
permission level. As of right now you will not be able to log into these
accounts. They are only used in tests.
