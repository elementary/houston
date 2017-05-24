# houston/src/

This folder holds all of the houston code base. Each folder, with the exception
of `cli` and `lib`, hold the code for a different process of houston.

## cli/

This folder holds all of the code needed to get the configuration setup and
start a process. It also holds some useful scripts like database migration
and seeding.

## lib/

This folder holds universal code used in multiple processes. Look here if you
need to change something about the database.
