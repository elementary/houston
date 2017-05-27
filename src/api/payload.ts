/**
 * houston/src/api/payload.ts
 * Common JSON api payloads
 *
 * @export {Interface} Error - An API Error
 * @export {Interface} Response - An API Response
 */

export interface Error {
  id?: string
  links?: {
    about?: string
  }
  status: number
  code?: string
  title: string
  detail?: string
  source?: {
    pointer?: string
    parameter?: string
  }
  meta?: object
}

export interface Response {
  errors?: Error[]
  data?: object|object[]
  meta?: {
    commit?: string
    date?: Date
    environment?: string
    version?: string
  }
  links?: {
    self?: string
  }
  jsonapi?: {
    version?: string
  }
}
