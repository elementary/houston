# houston/src/

This folder holds all of the houston code base. Each folder, with the exception
of `cli` and `lib`, hold the code for a different process of houston.

## api/

This holds the code for the API server. It is strictly JSON based with no html.
Anything related to the client, including pages, styles, and endpoints related
to browser information should be in `client/`.

## cli/

This folder holds all of the code needed to get the configuration setup and
start a process. It also holds some useful scripts like database migration
and seeding.

## client/

This folder is everything the user sees. It handles controllers for the client
routes, and markup for styles and pages.

## lib/

This folder holds universal code used in multiple processes. Look here if you
need to change something about the database.

## repo/

This holds the code for the repository syslog server. This is used by nginx
to record download counts of files in the repository.
