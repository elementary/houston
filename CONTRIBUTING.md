# Houston
**Prepare for liftoff.**

Firstly, thank you for taking the time to contribute to Houston :+1:

Houston would be but a glimmering dream if it were not for the astounding
contributions make by third-party developers. To keep contribution as easy as
possible, and to keep Houston working as it should, we have put together a
comprehensive document of things you should know when contributing to Houston.

Before we get started, please read the
[elementary code of conduct](https://elementary.io/code-of-conduct).

- [Issues](#Issues)
- [Coding](#Coding)
- [appHooks](#appHooks)
- [Houston](#Houston)

Unsure what needs to be done on Houston? Try looking at some of the
[issues](https://github.com/elementary/houston/issues?q=is%3Aopen+is%3Aissue+label%3ABitesize)
and submitting a [pull request](#Pull-Requests).

## Issues

If you find an issue or bug with Houston or any of it's appHooks, please submit
an [issue on GitHub](https://github.com/elementary/houston/issues/new). To help
clear confusion and increase productivity, here are some general rules to follow
when submitting an issue.

* **Use a clear and descriptive title** that identifies the problem.
* **Include steps to reproduce** the issue so developers can test solutions.
Even the simplest step is sometimes the cause.
* **Include details about your application**. This helps developers identify if
the issue is only for your application, or for others. This may include links to
GitHub repositories or issues.
* **If the problem wasn't triggered** describe what you were doing before the
problem occurred.
* **Explain what you expected to happen**. Even if it's super obvious.

## Coding

Pull requests are the best way to see an issue fixed or a feature you want added
to Houston. To keep the code clean, and friendly for everyone we have setup some
rules you should follow before submitting.

Firstly, you should be familiar with
[es6 javascript](https://github.com/lukehoban/es6features). We use this a lot
in our code, and expect all pull requests to use it.

Some rule of thumbs for coding:
* Never use `var`. Use `const` if it is only declared once, or `let`.
* Use arrows when you can.
* Compress code to a single line when it makes sense.
* Use template strings
* Single line comments go on a unique line with one blank line above
* Comment what is hard or confusing to understand

**Lint your code**! This ensures everything stays legible, and easy to read.
For simplicity, just run `npm run lint` before you `git commit`.

## appHooks

### Houston vs appHooks

To keep Houston as simple and stream line as possible, we have segregated tests
(named appHooks) from Houston core. This allows an easier time for developers
to integrate new and exciting tests to the Houston library, without getting
there hands dirty in the boring Houston core.

## Houston

### Status relationships

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
