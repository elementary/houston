/**
 * houston/src/lib/utility/rdnn.ts
 * Some higher level RDNN functions
 */

/**
 * Sanitizes an RDNN string for common mistakes and better unification
 * @see https://github.com/elementary/houston/issues/566
 *
 * @param {string} rdnn
 * @param {string} [normalizer] The string to use instead of spaces
 * @return {string}
 */
export function sanitize (rdnn: string, normalizer = '_'): string {
  return rdnn
    .replace(/\s/gi, normalizer)
    .replace(/\.([0-9])/gi, `.${normalizer}$1`)
    .replace(/\_|\-/gi, normalizer)
    .toLowerCase()
}
