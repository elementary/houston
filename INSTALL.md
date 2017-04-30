# Installing Houston

## Needed Services

Houston relies on a multitude of other services. For a fully working
installation you will want to ensure all of these services are setup, working,
and fully accessible to Houston.

You will need:
- A [Knexjs supported database](http://knexjs.org/#Installation-node)
- An [Aptly repository](https://www.aptly.info/)
- A **local** [Docker](https://www.docker.com/) server
- A [GitHub OAuth](https://github.com/organizations/elementary/settings/applications) application

We highly recommend you also have:
- A [Stripe connect](https://dashboard.stripe.com/account/applications/settings) account
- A [Mandrill](https://mandrillapp.com) account

## Running Houston

To setup Houston you will need a working node environment. Each operating system
is different, so it's best to refer to the official
[node documentation](https://nodejs.org/en/download/) on installing.

_We highly recommend using `yarn` to keep your package versions in line with
what we use for production. If you would like to use npm instead, replace `yarn`
in the following commands with `npm`._

Next you will need to install the needed node packages. This is done with:
```shell
yarn install
```

Then build Houston with:
```shell
yarn run build
```

You will need to setup your configuration. Simply copy the `config.example.js`
file to another location and edit it's values. This file is well documented with
possible values and links to needed third party services.

Lastly, you can run houston with:
```shell
node ./dest/cli/houston.js
```

For a full list of commands run:
```shell
node ./dest/cli/houston.js --help
```
