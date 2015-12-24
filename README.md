# Houston
**Prepare for liftoff.**

AppHub developer dashboard and backend.

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

## Hacking on Houston (how-to)

We'd love your help hacking on Houston! Getting a local development environment set up is easy, and we've prepared a short guide to walk you through step-by-step. Just follow along below, and if you have any issues, don't hesitate to [ask for help](https://github.com/elementary/houston/issues/new).

We use [Vagrant](https://www.vagrantup.com/) to simplify management of our local development environments.

Setting up Vagrant is super simple. Just download and install [Vagrant](https://www.vagrantup.com/downloads.html) and [VirtualBox](https://www.virtualbox.org/wiki/Downloads).

Then, run `vagrant up` from the root of the directory where you cloned this repository.

This will spin up an Ubuntu virtual machine as per our Vagrant file and [rsync](https://en.wikipedia.org/wiki/Rsync) the contents of the repository directory into the VM. If you'd like to connect to the VM and poke around, you can do so with `vagrant ssh`. The synced directory lives in `~/houston`.

Now that you've got your development environment set up, you'll need to set up Houston's config file, `config.json`.

Copy the config file template:

```cp config.example.json config.json```

Then, create a GitHub OAuth application for testing Houston: https://github.com/settings/applications/new.

Name the application "Houston Local", and set the homepage and callback URLs to your local machine, like this:

`homepage`: http://localhost:3000

`callback URL`: http://localhost:3000/auth/github/callback

It should look something like this:

![](https://i.imgur.com/PGKT7GC.png)

Click Register application, and then copy and paste the newly created application's Client ID into `config.json` under `GITHUB_CLIENT_ID` and copy the Client Secret under `GITHUB_CLIENT_SECRET`.

![](https://i.imgur.com/D0VxJcX.png)

Your `config.json` should now look something like this:

```json
{
  "GITHUB_CLIENT_ID": "1e9ec151a7728abaa304",
  "GITHUB_CLIENT_SECRET": "9ccde02a1633b27232ee07662b7a688c43018b1f",
  "GITHUB_CALLBACK": "http://server2.elementaryos.org:3000/auth/github/callback",
  "SESSION_SECRET": "testingsessions",
  "MONGODB_URL": "mongodb://localhost/houston-dev",
  "JENKINS_ENABLED": false,
  "JENKINS_URL": "http://<jenkins username>:<jenkins user api token>@jenkins.elementaryos.org",
  "JENKINS_JOB": "deb-new-test",
  "JENKINS_SECRET": "test"
}
```

Now, re-sync the Vagrant VM with `vagrant reload`.

Open up a browser and visit http://localhost:3000, and you should see the Houston website.

If you do — congratulations, you're all ready to hack on Houston! Please take a look at the [open issues](https://github.com/elementary/houston/issues) and submit a [Pull Request](https://help.github.com/articles/creating-a-pull-request/) with your changes :) We really appreciate your help!

## Contributing

We [lint](https://en.wikipedia.org/wiki/Lint_(software) our JavaScript code with [JSCS](http://jscs.info) to ensure our code is consistently styled and formatted.

Please lint your code before submitting a pull request :)
