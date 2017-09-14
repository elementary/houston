/**
 * houston/src/worker/storable.ts
 * An interface for storing worker data.
 *
 * @exports {Interface} Storable
 */

export interface Storable {
  nameDeveloper: string,
  nameDomain: string,
  nameAppstream: string,
  nameHuman: string,

  version: string,

  appcenter: object
  appstream: object
}
