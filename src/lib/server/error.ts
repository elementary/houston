/**
 * houston/src/lib/server/error.ts
 * Some basic HTTP server errors
 *
 * @exports {Error} ServerError - An HTTP web server
 * @exports {ServerError} ParameterError - Errors for user given url parameters
 * @exports {ServerError} AttributeError - Errors for user given body field
 */

/**
 * ServerError
 * A basic HTTP error
 * NOTE: The error message is public facing. Do not give it private details.
 *
 * @property {boolean} expose - If this error should be sent to the client
 * @property {number} status - The HTTP status code
 */
export class ServerError extends Error {

  public expose = true
  public status: number

  /**
   * Creates a new ServerError
   *
   * @param {string} message - The message to be sent to the client.
   * @param {number} status - The Http status code
   */
  constructor (message: string, status = 500) {
    super(message)

    this.status = status
  }
}

/**
 * ParameterError
 * Errors for user given url parameters
 *
 * @property {string} parameter - The parameter that caused the error
 */
export class ParameterError extends ServerError {

  public parameter: string

  /**
   * Creates a new ParameterError
   *
   * @param {string} message - The message to be sent to the client.
   * @param {string} parameter - The parameter that caused the error
   * @param {number} status - The Http status code
   */
  constructor (message: string, parameter: string, status = 400) {
    super(message, status)

    this.parameter = parameter
  }
}

/**
 * AttributeError
 * Errors for user given body field
 *
 * @property {string} attribute - JSON pointer to attribute that errored
 */
export class AttributeError extends ServerError {

  public attribute: string

  /**
   * Creates a new AttributeError
   *
   * @param {string} message - The message to be sent to the client.
   * @param {string} attribute - The attribute that caused the error
   * @param {number} status - The Http status code
   */
  constructor (message: string, attribute: string, status = 400) {
    super(message, status)

    this.attribute = attribute
  }
}
