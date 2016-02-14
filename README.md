# Houston
**Prepare for liftoff.**

The concept of Houston is to create a developer dashboard and backend for converting GitHub repos into Debian packages. Developers create a repo containing a `.apphub` file which is then shown on their dashboard. Houston reports the status of the repo here:

* Needs Release: This repo needs a new git tag that is not already associated with a build and with a suitable changelog before it can be published
* Publish: The repo has a git tag that doesn't already have an associated build
* In Progress: The repo is currently being tested or built.
* Failure: The repo was not succesfully published as a debian package due to build failure or test suite failure. At this stage, houston will file issues with more detail into the repo's GitHub issues tracker
* Needs Review: The git repo was succesfully built into a debian package and requires a human to move it from the "testing" deb repo to the "stable" deb repo. After this task is completed, start over with "Needs Release" status.

## Architecture Overview
* HTML/CSS/JS
* [Handlebars](http://handlebarsjs.com/) templates
* [Node.js](https://nodejs.org/en/) backend ([ES2015 syntax](git.io/es6features) via [Babel](babeljs.io))
* [GitHub OAuth API](https://developer.github.com/v3/oauth/)
* [Jenkins](https://jenkins-ci.org/)
* [MongoDB](https://www.mongodb.org/)
* [Stripe Connect](https://stripe.com/connect)
* [Liftoff](https://github.com/elementary/liftoff) (Cody's build scripts, repo currently private)
* **[Learn more](https://docs.google.com/document/d/1nHCnxNpaQI8G2VdJKFeri12krLpgtUQllMj8_PdZ7P8/edit)**

Houston is the glue between GitHub and our repository system. Ideally when you first create a project on GitHub, you would go to houston and initialize the repository. This will setup houston to monitor the repository with GitHub hooks (eventually, for now it's manual with houston's web interface).

When a release is created on GitHub, and you choose to publish that release through Houston, Houston will run some tests on it. These tests currently include automatically checking for an app icon, and some strings in the .desktop file. It will be expanded in the future. At the same time, the repository will be passed to Jenkins, which will build the repo into a deb package. After it's built, a person from elementary will install the application and test for a multitude of things including but not limited to performance, aesthetics, and nativeness.

If the test fails, Houston will file an issue on GitHub explaining what the problem is, and some advice to fix it. If there are warnings, Houston will still file an issue, but will continue onto the next step.

At this point, the approved deb file will be moved into the stable repo. We will be using [Freight](https://github.com/rcrowley/freight) behind nginx to host the Debian repository. Ultimately this repository will be the focus of [AppCenter](https://launchpad.net/appcenter) and the whole elementary OS 3rd party app ecosystem.

## Hacking on Houston (how-to)

We'd love your help hacking on Houston! Getting a local development environment set up is easy, and we've prepared a short guide to walk you through step-by-step. Just follow along below, and if you have any issues, don't hesitate to [ask for help](https://github.com/elementary/houston/issues/new).

To get started working on Houston:

1. You'll need to set up Houston's config file, `config.js`. Copy the config file template:

  ```cp config.example.js config.js```

2. Then, create a GitHub OAuth application for testing Houston: https://github.com/settings/applications/new.

  Name the application "Houston Local", and set the homepage and callback URLs to your local machine, like this:

   `homepage`: http://localhost:3000

   `callback URL`: http://localhost:3000/auth/github/callback

   It should look something like this:

   ![](https://i.imgur.com/PGKT7GC.png)

3. Click Register application, and then copy and paste the newly created application's Client ID into `config.js` under `github.clientID` and copy the Client Secret under `github.secret`.

   ![](https://i.imgur.com/D0VxJcX.png)

   Your `config.js` should now include a section that looks something like this:

  ```js
  /**
   * Github access
   * https://github.com/settings/developers
   */
  github: {
    clientID: '1e9ec151a7728abaa304',
    secret: '9ccde02a1633b27232ee07662b7a688c43018b1f',
    // Github authentication callback url. Don't change '/auth/github/callback'
    callback: 'http://localhost:3000/auth/github/callback',
  },
  ```

We use [Vagrant](https://www.vagrantup.com/) to simplify management of our local development environments. Or you can skip the steps below to develop without Vagrant:

1. Setting up Vagrant is super simple. Just download and install [Vagrant](https://www.vagrantup.com/downloads.html) and [VirtualBox](https://www.virtualbox.org/wiki/Downloads). If you're running elementary OS or Ubuntu, you can use:

  ```sudo apt-get install vagrant virtualbox```

2. Run `vagrant up` from the root of the directory where you cloned this repository.

    This will spin up an Ubuntu virtual machine as per our Vagrant file and [rsync](https://en.wikipedia.org/wiki/Rsync) the contents of the repository directory into the VM. If you'd like to connect to the VM and poke around, you can do so with `vagrant ssh`. The synced directory lives in `~/houston`, and logs in `/var/log/houston.log`.

You can also choose to develop without Vagrant.

1. Install MongoDB, Node.js, and NPM

  ```sudo apt-get install mongodb nodejs-legacy npm```

2. run `npm install` to fetch needed dependencies.
3. Start the server with `npm start`


In either case, open up a browser and visit http://localhost:3000, and you should see the Houston website. If you do — congratulations, you're all ready to hack on Houston!

Please take a look at the [open issues](https://github.com/elementary/houston/issues) and submit a [Pull Request](https://help.github.com/articles/creating-a-pull-request/) with your changes :) We really appreciate your help!

## Contributing

Because we use a lot of new JavaScript code styles, it is strongly recommended to
read up on promises, and [ES6 shorthand](https://github.com/lukehoban/es6features).

Some things to keep note of while programming:
* If you don't change a variable, declare it with `const` vs `var`.
* Use arrows when you can. It keeps the code clean and easy to read.
* If you can fit the function in one clean line, do so.
  - `const notDotQuery = _.mapValues(dotQuery, value => ({ $ne: value }));`
* Template strings are here to help. Use them.
* Comments don't hurt.
* Promises always return some value, error or not.
* It is standard to return in promise with `return Promise.resolve()` vs `return null`.

We [lint](https://en.wikipedia.org/wiki/Lint_(software)) our JavaScript code with [JSCS](http://jscs.info) to ensure our code is consistently styled and formatted.

Please lint your code before submitting a pull request :)
