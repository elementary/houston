/**
 * Prebuild parse and test .apphub file
 */
import Promise from 'bluebird';
import Hubkit from 'hubkit';
import AppHook from '~/appHooks/appHook';

const gh = new Hubkit();
let hook = new AppHook('apphub', __dirname);

hook.question(release => {
  const application = release.ownerDocument();

  return gh.request(`GET /repos/${application.github.fullName}/contents/.apphub?ref=${release.github.tag}`, {
    token: application.github.APItoken,
  })
  .then(apphubData => {
    try {
      const apphubBase = new Buffer(apphubData.content, 'base64');
      hook.meta(JSON.parse(apphubBase.toString()));
    } catch (err) {
      hook.dump(err);
      hook.error('parse');
      return Promise.reject();
    }

    return Promise.resolve();
  });
});

hook.question(release => {
  let apphub = this.metadata;

  if (typeof apphub.priceUSD != 'undefined' && typeof apphub.priceUSD != 'number') {
    hook.error('price');
  } else if (apphub.priceUSD != null) {
    hook.update({priceUSD: apphub.priceUSD});
  }

  return Promise.resolve();
});

hook.question(release => {
  let apphub = this.metadata;

  if (typeof apphub.issueLabel != 'undefined' && typeof apphub.issueLabel != 'string') {
    hook.error('label');
  } else if (apphub.issueLabel != null) {
    hook.update({github: {label: apphub.issueLabel}});
  }

  return Promise.resolve();
});

export default hook
