/**
 * houston/src/lib/server/servable.ts
 * A super simple interface for things that can be considered a server
 */

export interface Servable {

  active: boolean

  listen (port?: number): Promise<Servable>
  close (): Promise<Servable>

}
