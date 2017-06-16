/**
 * houston/src/lib/service/base/repository.ts
 * A repository interface.
 *
 * @return {interface} Repository
 */

export interface Repository {
  url: string

  clone: (p: string, branch?: string) => Promise<void>
}
