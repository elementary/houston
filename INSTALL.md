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

Next you will need to install the needed node packages. This is done with:
```shell
npm ci
```

Then build Houston with:
```shell
npm run build
```

Then install it with:
```shell
npm link
```

_NOTE: Depending on how you installed node, you may have to run the above command
with `sudo`._

You will need to setup your configuration. Simply copy the `config.example.js`
file to another location and edit it's values. This file is well documented with
possible values and links to needed third party services.

Lastly, you can run houston with:
```shell
houston
```

For a full list of commands run:
```shell
houston --help
```
