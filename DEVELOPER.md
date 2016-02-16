# Houston
**Prepare for liftoff.**

A place for weird developer notes and tidbits.

## Status

#### Application
* Uninitialized** (boolean)
* Needs Release (releases has no length)
* (Give status of latest release)

#### Release
* Standby** (no builds yet)
* Pre (running appHooks on release)
* Building (one of the builds is building)
* Post (all builds are finished and any build on Post)
* Reviewing (all post are done and waiting to be failed or published)
* Failed* (any build, review or test failed)
* Published (all builds are published) -> send all current builds to repo

### Build
* Queued** (yet to be building in Jenkins)
* Building (started build in Jenkins)
* Post (running appHooks on build)
* Failed* (error in test or Jenkins build)
* Finished (post finishes without errors) -> upload to testing repo
