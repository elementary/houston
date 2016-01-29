/**
 * Parse and test .apphub file
 */
import Promise from 'bluebird';
import Hubkit from 'hubkit';

const gh = new Hubkit();

// List of all error and warning messages
const messages = {
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
    let updateObject = {}

    if (typeof apphubJSON.priceUSD != 'undefined' && typeof apphubJSON.priceUSD != 'number') {
      data.error.push(messages.price)
    } else if (apphubJSON.priceUSD != null) {
      updateObject.priceUSD = apphubJSON.priceUSD;
    }

    if (typeof apphubJSON.issueLabel != 'undefined' && typeof apphubJSON.issueLabel != 'string') {
      data.error.push(messages.label)
    } else if (apphubJSON.issueLabel != null) {
      updateObject['github.label'] = apphubJSON.issueLabel;
    }

    return application.update(updateObject) // Update application based on new information
    .then(() => {
      return Promise.resolve(data);
    });
  })
  .catch(err => {
    if (err.status === 404) {
      return Promise.resolve(data) // End test here due to no apphub file
    }

    return Promise.reject(err);
  });
}
