var app = require.main.require('./app');
var auth = require.main.require('./app/auth');
var Hubkit = require('hubkit');
var Q = require('q');
var ini = require('ini');

function getRepoDetails(gh, owner, repo) {
  // TODO: Rather than assuming the .desktop we want is
  // `data/${repo}`.desktop, we might want to list the directory
  // Contents and identify more generally if it's named something else.
  return new Promise((resolve, reject) => {
    return Q(gh.request(`GET /repos/:owner/:repo/contents/data/:repo.desktop`, {
      owner,
      repo,
    }))
    // Parse the .desktop file
    .then(desktopFileContents => {
      const contentBuf = new Buffer(desktopFileContents.content, 'base64');
      const desktopData = ini.parse(contentBuf.toString());
      const appName = desktopData['Desktop Entry'].Name;
      const appIcon = desktopData['Desktop Entry'].Icon;
      return [
        appName,
        gh.request('GET /repos/:owner/:repo/contents/icons/64/:appIcon.svg', {
          owner,
          repo,
          appIcon,
        }),
      ];
    })
    .spread((appName, iconFileContents) => {
      return resolve({
        owner,
        appName,
        repoName: repo,
        iconData: iconFileContents.content,
      });
    }, reject);
  });
}

app.get('/dashboard', auth.loggedIn, (req, res, next) => {
  let gh = new Hubkit({
    token: req.user.github.accessToken,
  });

  // Get the repositories the user owns or is a member of
  gh.request('GET /user/repos', { type: 'member' })
  .then(repos => {
    return Q.allSettled(
      repos
      .map(repo => {
        return gh.request('GET /repos/:owner/:repo/contents/:path', {
          owner: repo.owner.login,
          repo: repo.name,
          path: '.apphub',
        });
      }));
  })
  .then(contents => {
    return Promise.all(
      contents
      // If the .apphub file doesn't exist, the request to the
      // GitHub API returned a 404, which means the promise was rejected.
      .filter(contentPromise => contentPromise.state === 'fulfilled')
      // XXX: Would be better to get this data from the
      // GET ``/user/repos` request. Just haven't figured out
      // a good way to pass that data down the promise chain.
      .map(content => content.value.url.split('/').slice(4, 6))
      .map(([owner, repo]) => getRepoDetails(gh, owner, repo))
    );
  })
  .then(repos => {
    res.render('dashboard', {
      title: 'Dashboard',
      user: req.user,
      repos,
    });
  }, next);

});
