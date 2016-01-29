/**
 * Grab and test desktop launcher
 */
import Promise from 'bluebird';
import Hubkit from 'hubkit';
import ini from 'ini';

const gh = new Hubkit();

// List of all error and warning messages
const messages = {
  missing: 'You are missing an [app launcher](https://elementary.io/docs/human-interface-guidelines#app-launchers "App Launchers") file.',
  parse: 'Your app launcher file has an error in it. Please review the [app launcher](https://elementary.io/docs/human-interface-guidelines#app-launchers "App Launchers") guidelines for specifications.',
  name: 'Your app launcher file does not include a "Name" entry in the "Desktop Entry" section.',
}

// Export function for 'on update' test
export function commit(application) {
  // Array to store error and warning messages for returning
  let data = {
    error: [],
    warning: [],
  }

  return gh.request(`GET /repos/${application.github.fullName}/contents/data/${application.github.name}.desktop`, {
    token: application.github.APItoken,
  })
  .then(desktopData => {
    let desktopIni = {};
    try {
      const desktopBase = new Buffer(desktopData.content, 'base64');
      desktopIni = ini.parse(desktopBase.toString());
    } catch (error) {
      data.error.push(messages.parse);
      return Promise.resolve(data); // End test here due to unparsible desktop file
    }

    // Values to be updated in database
    let updateObject = {}

    if (typeof desktopIni['Desktop Entry'].Name != 'undefined' && typeof desktopIni['Desktop Entry'].Name != 'string') {
      data.error.push(messages.name)
    } else if (desktopIni['Desktop Entry'].Name != null) {
      updateObject.name = desktopIni['Desktop Entry'].Name;
    }

    return application.update(updateObject) // Update application based on new information
    .then(() => {
      return Promise.resolve(data);
    });
  })
  .catch(err => {
    if (err.status === 404) {
      data.warning.push(messages.missing);
      return Promise.resolve(data) // End test here due to no desktop file
    }

    return Promise.reject(err);
  });
}
