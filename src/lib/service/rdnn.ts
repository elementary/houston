/**
 * houston/src/lib/service/rdnn.ts
 * Some higher level RDNN functions
 */

/**
 * Sanitizes an RDNN string for common mistakes and better unification
 * @see https://github.com/elementary/houston/issues/566
 *
 * @param {string} rdnn
 * @return {string}
 */
export function sanitize (rdnn: string): string {
  return rdnn
    .replace(/\s/gi, '_')
    .replace(/\.([0-9])/gi, '._$1')
    .replace(/\-/gi, '_')
    .toLowerCase()
}
