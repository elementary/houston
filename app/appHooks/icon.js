/**
 * Grab and test icon files
 */
import Promise from 'bluebird';
import Hubkit from 'hubkit';

const gh = new Hubkit();

// List of all error and warning messages
const messages = {
  missing64: 'We have noticed you are missing an application icon. Please include an icon as described in the [elementary human interface guidelines](https://elementary.io/docs/human-interface-guidelines#iconography "Human Interface Guidelines").',
}

// Export function for 'on update' test
export function commit(application) {
  // Array to store error and warning messages for returning
  let data = {
    error: [],
    warning: [],
  }

  return gh.request(`GET /repos/${application.github.fullName}/contents/icons/64/${application.github.name}.svg`, {
    token: application.github.APItoken,
  })
  .then(iconData => {
    return application.update({ // Update application based on new information
      icon: iconData.content,
    })
    .then(() => {
      return Promise.resolve(data);
    });
  })
  .catch(err => {
    if (err.status === 404) {
      data.warning.push(messages.missing64);
      return Promise.resolve(data) // End test here due to no apphub file
    }

    return Promise.reject(err);
  });
}
