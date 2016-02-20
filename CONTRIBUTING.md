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
* Single line comments go on a unique line
* Comment what is hard or confusing to understand
* If it's a function, it should return a promise

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

By far one of the hardest parts to understand about Houston core is how all of
the statuses depend on each other. To help everyone understand, we made this:

```
Project | NEW INIT STANDBY QUEUE PRE BUILD POST REVIEW FAIL FINISH
Release |          STANDBY QUEUE PRE BUILD POST REVIEW FAIL FINISH
Cycle   |                  QUEUE PRE BUILD POST REVIEW FAIL FINISH
Build   |                  QUEUE     BUILD             FAIL FINISH
```

These statuses propagate upwards depending on different conditions. For
instance, if any build fails, the parent cycle will fail. If the cycle fails,
then the release will fail etc. Obviously each child is created because multiple
runs of the type can exist. For instance, a release could have multiple cycle
tests ran, and a cycle could have multiple builds depending on architecture and
distribution.

Simple rundown of what the statuses actually mean in terms of Houston:

* NEW - The project was discovered on GitHub, but no releases are imported
* INIT - The project has been imported to Houston, but no release is available
* STANDBY - The project has a release, and Houston is waiting to release it
* QUEUE - The release started a new cycle, and the cycle is in line to be tested
* PRE - appHooks are currently running pre-tests on the cycle
* BUILD - the build is currently building
* POST - appHooks are currently running post-tests on the cycle
* REVIEW - the cycle is being reviewed by a human
* FAIL - the cycle failed a appHook tests or failed a build
* FINISHED - the current release is published for the world to see

### Models

Here are some things to keep in mind while working on Houston core models.

* All items prefixed with `_` are dynamic. No function reads this value
directly. While still settable when creating a document, functions may not use
that value later on.
* Many relationships change between methods prefixed with `get` like
`getProject()` and virtuals like `project`. Make sure you keep track of what you
want to call.
* All model functions are sorted by type, then by the order they are defined in
the schema.
  - virtual relationships
  - virtual
  - method relationships
  - methods
  - statics
  - middleware
