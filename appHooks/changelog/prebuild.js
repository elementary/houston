/**
 * Check that all releases have a changelog
 */
import Promise from 'bluebird';
import AppHook from '~/appHooks/appHook';

let hook = new AppHook('changelog', __dirname);

hook.question(release => {
  const application = release.ownerDocument();

  return Promise.filter(application.releases, release => {
    return release.changelog == null;
  })
  .each(release => {
    hook.error(release.github.tag)
  })
  .then(() => Promise.resolve());
});

export default hook
