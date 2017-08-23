/**
 * houston/src/worker/task/debian/controlParser.ts
 * Reads and writes a Debian control file. I whould highly recommend reading the
 * Debian documentation about the Control file before editing too much of this
 * file.
 * @see https://www.debian.org/doc/debian-policy/ch-controlfields.html
 *
 * @exports {Class} Parser - Reads and writes a Debian control file
 */

import * as fs from 'fs-extra'

/**
 * All the types a line in the Debian control file can be
 * @see https://www.debian.org/doc/debian-policy/ch-controlfields.html 5.1
 *
 * @var {string}
 */
type LineType = 'simple' | 'folded' | 'multiline'

export class Parser {

  /**
   * The location to the file.
   *
   * @var {string}
   */
  public readonly file: string

  /**
   * Returns the type of line that is being parsed.
   *
   * @param {string} data - The raw string data
   * @param {number} line - The line to check type
   * @return {LineType}
   */
  private static readLineType (data: string, line = 0): LineType {
    const lines = data.split('\n').filter((l) => (l.trim() !== ''))

    const before = (lines[line - 1]) ? lines[line - 1] : ''
    const current = (lines[line]) ? lines[line] : ''
    const after = (lines[line + 1]) ? lines[line + 1] : ''

    if (before.trim().endsWith(',') || current.trim().endsWith(',')) {
      return 'folded'
    }

    if (current.startsWith(' ') || after.startsWith(' ')) {
      return 'multiline'
    }

    return 'simple'
  }

  /**
   * Given some JavaScript data, we tell you what type of line to write.
   *
   * @param {string|string[]} data - The data to check
   * @return {LineType}
   */
  private static writeLineType (data: string|string[]): LineType {
    if (Array.isArray(data)) {
      return 'folded'
    }

    if (data.indexOf('\n') !== -1) {
      return 'multiline'
    }

    return 'simple'
  }

  /**
   * Creates a new Parser class
   *
   * @param {string} file - The location to the file.
   */
  public constructor (file: string) {
    this.file = file
  }

  /**
   * Reads the file and parses it to easy to understand javascript.
   *
   * @async
   * @return {object}
   */
  public async read (): Promise<object> {
    const exists = await fs.pathExists(this.file)
    if (exists === false) {
      return {}
    }

    const output = {}
    let lastKey: string

    const raw = await fs.readFile(this.file, { encoding: 'utf8' })
    const lines = raw.split('\n').filter((l) => (l.trim() !== ''))

    lines.forEach((line, i) => {
      const type = Parser.readLineType(raw, i)

      if (type === 'simple') {
        const breakIndex = line.indexOf(':')
        const key = line.substring(0, breakIndex).trim()
        const value = line.substring(breakIndex + 1).trim()

        output[key] = value
        lastKey = key
        return
      }

      if (type === 'folded') {
        const breakIndex = line.indexOf(':')
        let firstLine = true

        let key: string
        let value: string

        if (breakIndex !== -1) {
          key = line.substring(0, breakIndex).trim()
          value = line.substring(breakIndex + 1).trim()
        } else {
          firstLine = false

          key = ''
          value = line.trim()
        }

        // Avoid variables with ':' in them looking like fake key values
        if (key.indexOf('${') !== -1) {
          firstLine = false
          value = line.trim()
        }

        if (value.endsWith(',')) {
          value = value.slice(0, -1)
        }

        if (firstLine) {
          output[key] = [value]
          lastKey = key
          return
        }

        output[lastKey].push(value)
        output[lastKey].sort()
      }

      if (type === 'multiline') {
        const breakIndex = line.indexOf(':')

        if (breakIndex !== -1) {
          const key = line.substring(0, breakIndex).trim()
          const value = line.substring(breakIndex + 1).trim()

          output[key] = value
          lastKey = key
          return
        }

        output[lastKey] += `\n${line.trim()}`
      }
    })

    return output
  }

  /**
   * Reads the file and parses it to easy to understand javascript.
   *
   * @async
   * @param {object} data - The data to write to file
   * @return {string}
   */
  public async write (data: object): Promise<string> {
    await fs.ensureFile(this.file)

    let output = ''

    Object.keys(data).forEach((key) => {
      const line = data[line]
      const type = Parser.writeLineType(line)

      console.log(line, type)
    })

    return output
  }
}
