/**
 * lib/local.js
 * Simple helper of child processes
 *
 * @exports {Function} cmd - Runs command in child process
 */

import _ from 'lodash'

const spawn = require('child_process').spawn

/**
 * cmd
 * Runs command in child process
 *
 * @param {String} command - shell command to run
 * @returns {Number} - output of command
 */
export function cmd (command) {
  const arr = command.split(' ')

  return new Promise((resolve, reject) => {
    const child = spawn(arr[0], _.drop(arr))

    let out = ''

    child.stdout.on('data', (data) => {
      out += `${data}\n`
    })
    child.stderr.on('data', (data) => {
      out += `${data}\n`
    })

    child.on('error', (err) => {
      return reject(err)
    })

    child.on('close', (code) => {
      const result = out.substring(0, out.length - 2)

      if (code === 0) {
        return resolve(result)
      } else {
        return reject(result)
      }
    })
  })
}
