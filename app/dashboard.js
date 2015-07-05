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
  // Transform the repo results from GitHub into our application format
  .map(repoResult => ({
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
    appHubFileResult: null,
  }))
  // Ask GitHub for the .AppHub file
  .map(fetchAppHubFile)
  // Filter out repos which do not contain a top-level '.apphub' file
  .filter(promise => promise.isFulfilled())
  // De-reflect promise
  .map(promise => promise.value())
  .map(parseAppHubFileIfPossible)
  .map(fetchDesktopFileIfPossible)
  .map(fetchAppIconIfPossible)
  .then(applications => {
    res.render('dashboard', {
      title: 'Dashboard',
      user: req.user,
      applications,
    });
  })
  .catch(next);

  function fetchAppHubFile(application) {
    const fullName = application.repo.fullName;
    return Promise.resolve(gh.request(`GET /repos/${fullName}/contents/.apphub`))
    .then(appHubFileResult => {
      application.appHubFileResult = appHubFileResult;
      return application;
    })
    // We want this promise to always be successful when settled
    // because "failing" is not unexpected behavior (when it's a 404).
    // That simply means the repository doesn't have an .apphub file,
    // and so we should filter it out.
    .reflect();
  }

  function parseAppHubFileIfPossible(application) {
    return Promise.try(() => {
      // Parse the .desktop file
      const appHubFileBuf = new Buffer(application.appHubFileResult.content, 'base64');
      const appHubData = JSON.parse(appHubFileBuf.toString());
      application.priceUSD = appHubData.priceUSD;
      delete application.appHubFileResult;
      return application;
    })
    .catch(() => application);
  }

  function fetchDesktopFileIfPossible(application) {
    const fullName = application.repo.fullName;
    const repoName = application.repo.name;
    return gh.request(`GET /repos/${fullName}/contents/data/${repoName}.desktop`)
    .then(desktopFileResult => {
      // Parse the .desktop file
      const desktopFileBuf = new Buffer(desktopFileResult.content, 'base64');
      const desktopData = ini.parse(desktopFileBuf.toString());
      application.name = desktopData['Desktop Entry'].Name;
      application.icon.name = desktopData['Desktop Entry'].Icon;
      return application;
    })
    .catch(() => application);
  }

  function fetchAppIconIfPossible(application) {
    const fullName = application.repo.fullName;
    const iconName = application.icon.name;
    return gh.request(`GET /repos/${fullName}/contents/icons/64/${iconName}.svg`)
    .then(appIconResult => {
      // `appIconResult.content` is already base64-encoded
      application.icon.data = appIconResult.content;
      return application;
    })
    .catch(() => application);
  }

});
