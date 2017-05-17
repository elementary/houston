/**
 * houston/test/utility/ci.ts
 * Utility classes for tests running on continuous integration. Most of these
 * apply to travis.
 *
 * @exports {Function} isCi - Checks if the current test is ran in CI
 */

/**
 * isCi
 * Checks if the current process is ran in CI. Useful for disabling some tests.
 *
 * @return {boolean}
 */
export function isCi (): boolean {
  if (process.env.CI === true) {
    return true
  }

  if (process.env.TRAVIS === true) {
    return true
  }

  return false
}
