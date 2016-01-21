/**
 * Parse and test .apphub file
 */
import Promise from 'bluebird';
import Hubkit from 'hubkit';

const gh = new Hubkit();

// List of all error and warning messages
const messages = {
  missing: "We have noticed you don't have an `.apphub` file. If you would like to provide additional information to Houston, please include an `.apphub` file in your repository.",
  parse: 'Unable to parse `.apphub` file. Please check `.apphub` for formating issues',
  price: '`.apphub` includes an incorrect price',
  label: '`.apphub` includes an invalid issueLabel field',
}

// Export function for 'on update' test
export function update(application) {
  // Array to store error and warning messages for returning
  let data = {
    error: [],
    warning: [],
  }

  return gh.request(`GET /repos/${application.github.fullName}/contents/.apphub`, {
    token: application.github.APItoken,
  })
  .then(apphubData => {
    let apphubJSON = {};
    try {
      const apphubBase = new Buffer(apphubData.content, 'base64');
      apphubJSON = JSON.parse(apphubBase.toString());
    } catch (err) {
      data.error.push(messages.parse);
      return Promise.resolve(data) // End test here due to parsing error
    }

    // Values to be updated in database
    let priceUSD = null;
    let label = null;

    if (typeof apphubJSON.priceUSD != 'undefined' && typeof apphubJSON.priceUSD != 'number') {
      data.error.push(messages.price)
    } else {
      priceUSD = apphubJSON.priceUSD;
    }

    if (typeof apphubJSON.issueLabel != 'undefined' && typeof apphubJSON.issueLabel != 'string') {
      data.error.push(messages.label)
    } else {
      label = apphubJSON.issueLabel;
    }

    return application.update({ // Update application based on new information
      'github.label': label,
      priceUSD,
    })
    .then(() => {
      return Promise.resolve(data);
    });
  }, err => {
    if (err.status === 404) {
      data.warning.push(messages.missing);
      return Promise.resolve(data) // End test here due to no apphub file
    }

    return Promise.reject(`Received ${err.status} from GitHub`);
  });
}
