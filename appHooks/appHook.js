/**
 * Default appHook class definition
 */
import _ from 'lodash';
import Promise from 'bluebird';
import Dotize from 'dotize';
import Hubkit from 'hubkit';

import app from '~/';
import Application from '~/model/application';

const gh = new Hubkit();

export default class {
  constructor(name, path) {
    this.name = name;

    this.issuePath = `${path}/issue.md`;

    this.errors = [];
    this.warnings = [];
    this.dump = [];
    this.metadata = {};
    this.information = {};
    this.questions = [];

    app.log.info(`Initalized "${this.name}" appHook`);
  }

  error(name) {
    this.errors.push(name);
  }

  warn(name) {
    this.warnings.push(name);
  }

  dump(anything) {
    this.dump.push(anything);
  }

  meta(object) {
    this.metadata = _.extend(this.metadata, object);
  }

  update(object) {
    this.information = _.extend(this.information, object);
  }

  question(fn) {
    this.questions.push(fn);
  }

  // TODO: replace release with git clone path
  run(release) {
    const hook = this;
    hook.errors = [];
    hook.warnings = [];
    hook.dump = [];
    hook.metadata = {};
    hook.information = {};

    if (typeof release === 'undefined' || typeof release.ownerDocument === 'undefined') {
      app.log.error(`"${hook.name}" appHook called with invalid release document`);
      return Promise.reject(new Error(`"${hook.name}" appHook called with invalid release document`));
    }

    const application = release.ownerDocument();

    let qString = app.helper.nString('question', hook.questions);
    app.log.debug(`Asking ${qString} for "${hook.name}"`);

    return application.update({
      status: 'PREBUILD',
    })
    .then(() => {
      return Promise.each(hook.questions, question => {
        return question(release);
      })
      .catch(() => Promise.resolve()) // Testing errors are not actual errors
    })
    .then(() => {
      let update = {};

      _.extend(update, Dotize.convert(hook.information));

      if (!_.isEmpty(hook.errors)) {
        update.status = 'FAILED';
      }

      return application.update(update);
    })
    .then(() => {
      if (app.config.github.push && (hook.errors.length > 0 || hook.errors.length > 0)) {
        let req = `POST /repos/${application.github.fullName}/issues`;

        if (release.appHooks[hook.name] != null) { // Already exists on GitHub
          req = `PATCH /repos/${application.github.fullName}/issues/${release.appHooks[hook.name]}`;
        }

        let title = `${hook.name} has `;

        if (hook.errors.length > 0) {
          title += `${app.helper.nString('error', hook.errors)} `;
        }

        if (hook.warnings.length > 0 && hook.errors.length > 0) {
          if (hook.errors.length > 0) {
            title += 'and ';
          }

          title += `${app.helper.nString('warning', hook.warnings)} `;
        }

        title += `for [${release.github.tag}]`;

        return app.handlebars.render(hook.issuePath, {hook, release, application})
        .then(body => {
          return gh.request(req, {
            token: application.github.APItoken,
            body: {
              title,
              body,
              labels: [application.github.label],
            },
          })
          .then(() => Promise.resolve());
        });
      }

      if (!app.config.github.push && (hook.errors.length > 0 || hook.errors.length > 0)) {
        app.log.debug(`Supressing issue pushing for ${application.github.fullName} "${hook.name}"`);
      }

      app.log.silly(hook.dump);

      return Promise.resolve();
    })
    .then(() => {
      app.log.debug(`Answered ${app.helper.nString('error', hook.errors)} and ${app.helper.nString('warning', hook.warnings)} for "${this.name}"`)

      return Promise.resolve();
    });
  }
}
