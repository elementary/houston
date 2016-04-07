/**
 * lib/mistake.js
 * Helper for thowing errors with http status codes and data
 *
 * @exports {Class} - Extension of Error class including http error code
 */

 class Mistake extends Error {
   /**
    * WARN: Unnamed arguments ahead
    *
    * @param {Boolean} - Expose error message to end client
    * @param {Error} - Error to use as base
    * @param {Number} - Http error code
    * @param {String} - Error message
    */
   constructor (...args) {
     let data = null
     let error = new Error('error')
     let expose = null
     let message = null
     let status = null

     args.forEach((argu) => {
       if (argu instanceof Error) {
         error = argu
       } else if (typeof argu === 'number') {
         status = argu
       } else if (typeof argu === 'string') {
         message = argu
       } else if (typeof argu === 'boolean') {
         expose = argu
       } else {
         data = argu
       }
     })

     if (status == null && typeof error.status === 'number') {
       status = error.status
     } else if (status == null) {
       status = 500
     }

     if (message == null) {
       if (error.message !== 'error') {
         message = error.message
       } else if (status === 404) {
         message = 'Page not found'
       } else if (status === 403) {
         message = 'You do not have permission to access this page'
       } else if (status === 400) {
         message = 'Incorrect or insufficient data was sent'
       } else if (status === 503) {
         message = 'Service currently unaccessable'
       } else {
         message = 'Houston has encountered an error'
       }
     }

     super(message)

     this.data = data
     this.expose = (expose != null) ? expose : (status < 500)
     this.name = 'Mistake'
     this.stack = error.stack
     this.status = status

     this.inspect = () => {
       return `[${this.status} Error: ${this.message}]`
     }
   }
}

 export default Mistake
