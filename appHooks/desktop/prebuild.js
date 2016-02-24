/**
 * Prebuild parse and test application desktop file
 */
import Promise from 'bluebird';
import Hubkit from 'hubkit';
import AppHook from '~/appHooks/appHook';

const gh = new Hubkit();
let hook = new AppHook('desktop', __dirname);

hook.question(release => {
  const application = release.ownerDocument();

  return gh.request(`GET /repos/${application.github.fullName}/contents/data/${application.github.name}.desktop?ref=${release.github.tag}`, {
    token: application.github.APItoken,
  })
  .then(desktopData => {
    try {
      const desktopBase = new Buffer(desktopData.content, 'base64');
      hook.meta(JSON.parse(desktopBase.toString()));
    } catch (err) {
      hook.dump(err);
      hook.error('parse');
      return Promise.reject();
    }

    return Promise.resolve();
  });
});

hook.question(release => {
  let entry = hook.metadata['Desktop Entry'];

  if (typeof entry.Name != 'undefined' && typeof entry.Name != 'string') {
    hook.error('name');
  } else if (entry.Name != null) {
    hook.update({name: entry.Name});
  }

  return Promise.resolve();
});

export default hook
