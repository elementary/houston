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

## Projects

- `id` A UUID primary key

- `name_domain` A reverse domain name notation to identify the project
- `name_human` A human readable project name
- `name_developer` A human readable name of the developer or group

- `type` The type of project. Possible values include 'APPLICATION'. In place
for future use, where we will want to support 'CLI' and 'LIBRARY' type projects.

- `projectable_id` A 1:1 UUID referencing a service table ID
- `projectable_type` The type of service `projectable_id` is referencing. This
should always be the lowercase service name like `github` or `gitlab`.

- `stripe_id` A has one relationship referencing the `stripe_account` table

## Releases

- `id` A UUID primary key

- `version_major` An int Semver major release version (x.0.0)
- `version_minor` An int Semver minor release version (0.x.0)
- `version_patch` An int Semver patch release version (0.0.x)
- `version_test` An int test version to be used for prereleases

- `is_prerelease` A boolean to declare if this version is considered stable

- `releaseable_id` A belongs to relationship referencing a service table ID
- `releaseable_type` The type of service `releaseable_id` is referencing. This
should always be the lowercase service name like `github` or `gitlab`.

- `project_id` A belongs to relationship referencing the `projects` table
