import Hubkit from 'hubkit';
import Promise from 'bluebird';
import ini from 'ini';

import app from 'houston/app';
import { loggedIn } from 'houston/app/auth';
import { Application } from 'houston/app/models/application';

// Create Hubkit with a static instance
let gh = new Hubkit();

app.get('/dashboard', loggedIn, (req, res, next) => {
  Promise.resolve(gh.request('GET /user/repos', {
    type: 'public',
    token: req.user.github.accessToken,
  }))
  // Transform the repo results from GitHub into our application format, or load from the DB
  .map(repoData => findOrCreatefromGitHubData(repoData, req.user))
  // De-reflect promise
  .filter(promise => promise.isFulfilled())
  .map(promise => promise.value())
  .then(applications => {
    res.render('dashboard', {
      title: 'Dashboard',
      user: req.user,
      applications,
    });
  })
  .catch(next);
});

function findOrCreatefromGitHubData(repoData, user) {
  return Application.findOne({
    'github.owner': repoData.owner.login,
    'github.name':  repoData.name,
  }).exec()
  .then(repo => {
    if (repo) {
      // Found an existing repo in the Database
      console.log('Found repo: ' + repo.name);
      return Promise.resolve(repo)
        .then(Application.fetchReleases)
        .then(application => application.syncIssuesToGitHub())
        .then(application => application.save())
        .reflect();
    } else {
      return Promise.resolve(new Application({
        github: {
          owner: repoData.owner.login,
          name: repoData.name,
          repoUrl: repoData.git_url,
          APItoken: user.github.accessToken,
        },
      }))
      .then(Application.fetchAppHubFile)
      .then(Application.parseAppHubFileIfPossible)
      .then(Application.fetchDesktopFileIfPossible)
      .then(Application.fetchAppIconIfPossible)
      .then(Application.fetchReleases)
      .then(application => {
        console.log('Created repo: ' + application.name);
        return application.save();
      })
      .reflect();
    }
  });
}
