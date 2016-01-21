/**
 * Grab and test icon files
 */
import Promise from 'bluebird';
import Hubkit from 'hubkit';

const gh = new Hubkit();

// List of all error and warning messages
const messages = {
  missing: 'You are missing an [app launcher](https://elementary.io/docs/human-interface-guidelines#app-launchers "App Launchers") file.',
  parse: 'Your app launcher file has an error in it. Please review the [app launcher](https://elementary.io/docs/human-interface-guidelines#app-launchers "App Launchers") guidelines for specifications.',
  name: 'Your app launcher file does not include a "Name" entry in the "Desktop Entry" section.',
}

// Export function for 'on update' test
export function update(application) {
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
      return Promise.resolve(data); // End test here due to unparsible Desktop file
    }

    // Values to be updated in database
    let name = null;

    if (typeof desktopIni['Desktop Entry'].Name != 'undefined' && typeof desktopIni['Desktop Entry'].Name != 'string') {
      data.error.push(messages.name)
    } else {
      name = desktopIni['Desktop Entry'].Name;
    }

    return application.update({ // Update application based on new information
      name,
    })
    .then(() => {
      return Promise.resolve(data);
    });
  }, err => {
    if (err.status === 404) {
      data.error.push(messages.missing);
      return Promise.resolve(data) // End test here due to no desktop file
    }

    return Promise.reject(`Received ${err.status} from GitHub`);
  });
}
