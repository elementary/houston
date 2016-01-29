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
export function update(application) {
  // Array to store error and warning messages for returning
  let data = {
    error: [],
    warning: [],
  }

  // Update releases, but keep logic DRY
  return application.releaseFetchAll()
  .then(application => {
    application.releases.forEach(release => {
      if (release.changelog == null) {
        data.error.push(`${release.version} ${messages.missing}`);
      }
    })

    return Promise.resolve(data);
  });
}
