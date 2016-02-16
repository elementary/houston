/**
 * Prebuild parse and test .apphub file
 */
import Promise from 'bluebird';
import Hubkit from 'hubkit';
import AppHook from '~/appHooks/appHook';

const gh = new Hubkit();
let hook = new AppHook('icon', __dirname);

hook.question(release => {
  const application = release.ownerDocument();

  return gh.request(`GET /repos/${application.github.fullName}/contents/icons/64/${application.github.name}.svg?ref=${release.github.tag}`, {
    token: application.github.APItoken,
  })
  .then(icon => {
    hook.update({icon});
  })
  .catch(err => {
    if (err.status === 404) {
      hook.error(64)
      return Promise.resolve()
    }

    return Promise.reject();
  });
});

export default hook
