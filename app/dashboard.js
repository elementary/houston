import Hubkit from 'hubkit';
import Promise from 'bluebird';
import _ from 'underscore';
import ini from 'ini';

import app from '~/';
import { isBeta } from '~/auth';
import { Application } from '~/models/application';

// Create Hubkit with a static instance
let gh = new Hubkit();

// wrap for top-level error handling with async functions
// strongloop.com/strongblog/async-error-handling-expressjs-es7-promises-generators/
let wrap = fn => (...args) => fn(...args).catch(args[2]);

// returns `true` if the repo has a .apphub file
// in its top-level directory, otherwise returns `false`
function repoHasAppHubFile(repo, token) {
  return gh.request(`GET /repos/${repo}/contents/.apphub`, {token})
  .then(() => true)
  .catch(err => {
    // no .apphub file
    if (err.status == 404) return false;
    // some other error
    throw err;
  });
}

app.get('/dashboard', isBeta, wrap(async (req, res, next) => {
  const repos = await gh.request('GET /user/repos', {
    type: 'public',
    token: req.user.github.accessToken,
  });

  const appHubFileResults = await Promise.all(
    repos.map(repo => repoHasAppHubFile(
      repo.full_name,
      req.user.github.accessToken
    ))
  );

  const applications = await Promise.all(_.chain(_.zip(repos, appHubFileResults))
    .filter(([repo, hasAppHubFile]) => hasAppHubFile)
    .map(([repo, hasAppHubFile]) => {
      return Application.findOne({
       'github.owner': repo.owner.login,
       'github.name': repo.name,
      })
      .then(appFromDB => appFromDB || Promise.resolve(new Application({
          github: {
            owner: repo.owner.login,
            name: repo.name,
            repoUrl: repo.git_url,
            APItoken: req.user.github.accessToken,
          },
        }))
        .then(Application.parseAppHubFileIfPossible)
        .then(Application.fetchDesktopFileIfPossible)
        .then(Application.fetchAppIconIfPossible)
      )
      .then(Application.fetchReleases)
      .then(Application.syncIssuesToGitHub)
      .then(application => application.save())
    })
    .value()
  );

  res.render('dashboard', {
    title: 'Dashboard',
    user: req.user,
    applications,
  });
}));
