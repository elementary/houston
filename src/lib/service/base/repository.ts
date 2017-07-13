/**
 * houston/src/lib/service/base/repository.ts
 * A generaic repository interface
 */

export interface Repository {
  clone: (p: string, reference?: string) => Promise<void>
}
