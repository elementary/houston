var app = require.main.require('./app');
var auth = require.main.require('./app/auth');
var Hubkit = require('hubkit');
var Promise = require('bluebird');
var ini = require('ini');

app.get('/dashboard', auth.loggedIn, (req, res, next) => {

  let gh = new Hubkit({
    token: req.user.github.accessToken,
  });

  Promise.resolve(gh.request('GET /user/repos', { type: 'public' }))
  .map(repoResult => {
    return Promise.resolve(gh.request(
      `GET /repos/${repoResult.full_name}/contents/.apphub`
    )).then(appHubFileResult => ({
      repo: {
        owner: repoResult.owner.login, // 'elementary'
        name: repoResult.name, // 'wingpanel'
        fullName: repoResult.full_name, // 'elementary/wingpanel'
      },
      icon: {
        name: null, // 'wingpanel'
        data: null, // <base64-encoded image>
      },
      priceUSD: null, // An integer, from appHubFileResult
      appHubFileResult: appHubFileResult,
    })).reflect();
  })
  // Filter out repos which do not contain a top-level '.apphub' file
  .filter(promise => promise.isFulfilled())
  // De-reflect promise
  .map(promise => promise.value())
  .map(parseAppHubFile)
  .map(fetchDesktopFileIfPossible)
  .map(fetchAppIconIfPossible)
  .then(apps => {
    res.render('dashboard', {
      title: 'Dashboard',
      user: req.user,
      apps,
    });
  })
  .catch(next);

  function parseAppHubFile(app) {
    return Promise.try(() => {
      // Parse the .desktop file
      const appHubFileBuf = new Buffer(app.appHubFileResult.content, 'base64');
      const appHubData = JSON.parse(appHubFileBuf.toString());
      app.priceUSD = appHubData.priceUSD;
      delete app.appHubFileResult;
      return app;
    })
    .catch(() => (app));
  }

  function fetchDesktopFileIfPossible(app) {
    return gh.request(
      `GET /repos/${app.repo.fullName}/contents/data/${app.repo.name}.desktop`
    )
    .then(desktopFileResult => {
      // Parse the .desktop file
      const desktopFileBuf = new Buffer(desktopFileResult.content, 'base64');
      const desktopData = ini.parse(desktopFileBuf.toString());
      app.name = desktopData['Desktop Entry'].Name;
      app.icon.name = desktopData['Desktop Entry'].Icon;
      return app;
    })
    .catch(() => (app));
  }

  function fetchAppIconIfPossible(app) {
    return gh.request(
      `GET /repos/${app.repo.fullName}/contents/icons/64/${app.icon.name}.svg`
    )
    .then(appIconResult => {
      // `appIconResult.content` is already base64-encoded
      app.icon.data = appIconResult.content;
      return app;
    })
    .catch(() => (app));
  }

});
