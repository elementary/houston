# Houston
**We have liftoff.**

Houston is a developer dashboard and backend for converting GitHub repos into
Debian packages. Developers create a repo containing a `.apphub` file which is
then shown on their dashboard. From there Houston will clone, test, build, and
publish your application to AppHub.

[Learn more](https://docs.google.com/a/elementaryos.org/document/d/1nHCnxNpaQI8G2VdJKFeri12krLpgtUQllMj8_PdZ7P8/edit?usp=sharing)
about the technical details.


## Architecture Overview

* HTML/CSS/JS
* [Node.js](https://nodejs.org/en/) backend
* [GitHub OAuth API](https://developer.github.com/v3/oauth/) via
  [Passport](https://github.com/jaredhanson/passport-github)
* [MongoDB](https://www.mongodb.org/) with
  [Mongoose](https://github.com/Automattic/mongoose)
* [Stripe Connect](https://stripe.com/connect)
* [Liftoff](https://github.com/elementary/liftoff)
  (Cody's build scripts, repo currently private)

Houston is the glue between GitHub and our repository system. Ideally when you
first create a project on GitHub, you would go to Houston and initialize the
repository. This will setup Houston to monitor the repository with GitHub hooks.

When a release is created on GitHub, you will get an option to publish that
release in Houston's dashboard. Houston will then clone the repository, run
tests on the code, build the code with
[Liftoff](https://github.com/elementary/liftoff), and publish it to a
**testing** repository. At this point someone from elementary will install the
application and continue running tests. This ensures the best performance, user
experience, and desktop integration for any application in AppHub.

If any test fails, Houston will submit an issue on GitHub with detailed
information on the problems, and in some cases, solutions to fix it. After
fixing these issues you will be able to resubmit your application for
publishing.

At this point, the approved application will be moved into the stable repo, and
available to all users of elementary OS. We will be using
[aptly](https://github.com/smira/aptly) behind nginx to host the repository.
Ultimately this repository will be the focus of
[AppCenter](https://launchpad.net/appcenter) and the elementary OS 3rd party
app ecosystem.


## Hacking on Houston (how-to)

We'd love your help hacking on Houston! Getting a local development environment
set up is easy, and we've prepared a short guide to walk you through
step-by-step. Just follow along below, and if you have any issues, don't
hesitate to [ask for help](https://github.com/elementary/houston/issues/new).


#### Configuration

1. You'll need to set up Houston's config file, `config.js`. Copy the config
  file template:

  `cp config.example.js config.js`

2. Then, create a GitHub OAuth application for testing Houston:
  https://github.com/settings/applications/new.

  Name the application "Houston Local", and set the homepage and callback URLs
  to your local machine, like this:

   Homepage URL: http://localhost:3000

   Authorization callback URL: http://localhost:3000/auth/github/callback

   It should look something like this:

   ![](https://i.imgur.com/PGKT7GC.png)

3. Click 'Register application', and then copy and paste the newly created
  application's Client ID into `config.js` under `github.clientID` and copy the
  Client Secret under `github.secret`.

   ![](https://i.imgur.com/D0VxJcX.png)

   Your `config.js` should now include a section that looks something like this:

  ```js
  // https://github.com/settings/developers
  export let github = {
    client: '1e9ec151a7728abaa304',
    secret: '9ccde02a1633b27232ee07662b7a688c43018b1f',

    // Post data to GitHub?
    post: true
  }
  ```


#### Vagrant

We use [Vagrant](https://www.vagrantup.com/) to simplify management of our local
development environments. This ensures you have the correct versions of all
dependencies, and makes it easier to track down bugs. If you would like to
develop without using Vagrant you can skip this step and continue to the
[barebones](#barebones) instructions.

1. Setting up Vagrant is super simple. Just download and install
  [Vagrant](https://www.vagrantup.com/downloads.html) and
  [VirtualBox](https://www.virtualbox.org/wiki/Downloads). If you're running
  elementary OS or Ubuntu, you can run these commands in terminal:

  `sudo apt-get install vagrant virtualbox`

2. Run `vagrant up` from the root of the directory where you cloned this
  repository.

    This will spin up an Ubuntu virtual machine as per our Vagrant file and
    [rsync](https://en.wikipedia.org/wiki/Rsync) the contents of the repository
    directory into the VM. If you'd like to connect to the VM and poke around,
    you can do so with `vagrant ssh`. The synced directory lives in `~/houston`,
    and logs in `/var/log/houston.log`.


#### Barebones

Although we prefer using Vagrant for developing, if you wish to avoid it,
here's what you will need to do.

1. Install MongoDB

  `sudo apt-get install mongodb`

2. Install node and npm

    Depending on your distribution of choice, you might need to download and
    compile node from the [website](https://nodejs.org). Keep in mind that
    Houston requires node version `4.2.6` or above.

2. run `npm install` to fetch needed dependencies.
3. Start the server with `npm start`


#### Accessing

In either case, open up a browser and visit http://localhost:3000, and you
should see the Houston website. Congradulations! Please take this time to read
the [contributing](CONTRIBUTING.md) guidelines before submitting code or issues.
