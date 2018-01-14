/**
 * houston/src/lib/service/base/repository.ts
 * A generaic repository interface
 */

export interface Repository {
  url: string,
  rdnn: string,
  clone: (p: string, reference?: string) => Promise<void>
  references: () => Promise<string[]>
}
