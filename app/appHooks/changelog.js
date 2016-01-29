/**
 * Check and update release's changelog
 */
import Promise from 'bluebird';
import Hubkit from 'hubkit';

const gh = new Hubkit();

// List of all error and warning messages
const messages = {
  // Returned like: v1.2.3 is missing a changelog...
  missing: 'is missing a changelog. Please edit your GitHub release body to include changes made in this version.',
}

// Export function for 'on update' test
export function commit(application) {
  // Array to store error and warning messages for returning
  let data = {
    error: [],
    warning: [],
  }

  // Update releases, but keep logic DRY
  return application.releaseFetchAll()
  .then(application => {
    return Promise.filter(application.releases, release => {
      return release.changelog == null;
    });
  })
  .each(release => { // An array of releases with no changelog
    data.error.push(`${release.version} ${messages.missing}`);
    return Promise.resolve(null)
  })
  .then(() => {
    return Promise.resolve(data);
  });
}
