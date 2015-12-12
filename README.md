# elementary Houston
**Prepare for liftoff.**

Prototype for the AppHub developer dashboard and backend.

# Architecture
* HTML/CSS/JS/Node.js
* GitHub
* Jenkins
* Mongo DB
* Stripe Connect
* Liftoff (Cody's build script)
* [More Info](https://docs.google.com/document/d/1nHCnxNpaQI8G2VdJKFeri12krLpgtUQllMj8_PdZ7P8/edit)

# Local Development
For a local development environment, you will need:
* `nodejs-legacy`
* `mongodb`
* `npm`

1. Create your own GitHub application at https://github.com/settings/applications/new
2. `cp config.example.json config.json`
3. Take the keys and put them in the `config.json` file.
4. Configure all the other settings in `config.json`
5. Run `npm install` to install all required packages.
6. Run the server in the repo with `npm start` (optionally install nodemon (`npm -g install nodemon`) and run it with that to have it restart automatically on file changes, e.g. `nodemon --exec "npm start"`)
7. Visit the local instance at localhost:3000

We all validate our coding style with [jscs](http://jscs.info) to avoid using different code styles throughout our javascript and validate syntax. Please check all of the code you contribute.
