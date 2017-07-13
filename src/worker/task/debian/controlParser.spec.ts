/**
 * houston/src/worker/task/debian/controlParser.spec.ts
 * Tests the ability to read and write Debian control files.
 */

import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import { Parser } from './controlParser'

import { tmp } from '../../../../test/utility/fs'

const gold1File = path.resolve(__dirname, '../../../../test/worker/task/debian/control/gold1')
const gold2File = path.resolve(__dirname, '../../../../test/worker/task/debian/control/gold2')

const gold1Data = {
  'Architecture': 'any',
  'Build-Depends': [
    'cmake',
    'debhelper (>= 9)',
    'libevdev-dev',
    'libgranite-dev',
    'libgtk-3-dev',
    'libgudev-1.0-dev',
    'libjson-glib-dev',
    'valac (>= 0.26)'
  ],
  'Depends': '${misc:Depends}, ${shlibs:Depends}',
  'Description': 'Spice-Up\nCreate simple and beautiful presentations',
  'Maintainer': 'Felipe Escoto <xxxxxx@xxxxx.com>',
  'Package': 'com.github.philip-scott.spice-up',
  'Pre-Depends': 'dpkg (>= 1.15.6)',
  'Priority': 'optional',
  'Section': 'editors',
  'Source': 'com.github.philip-scott.spice-up',
  'Standards-Version': '3.9.6'
}

const gold2Data = {
  'Architecture': 'all',
  'Build-Depends': 'debhelper (>= 9)',
  'Build-Depends-Indep': 'python3, dh-python',
  'Depends': [
    '${misc:Depends}',
    '${python3:Depends}',
    'gir1.2-gdkpixbuf-2.0',
    'gir1.2-glib-2.0',
    'gir1.2-gtk-3.0',
    'gir1.2-pango-1.0',
    'gir1.2-webkit2-4.0',
    'python3-gi',
    'python3-yaml'
  ],
  'Description': 'RedNotebook is a modern desktop journal. It lets you\nformat, tag and search your entries. You can also add pictures, links\nand customizable templates, spell check your notes, and export to\nplain text, HTML, Latex or PDF.',
  'Homepage': 'http://rednotebook.sourceforge.net/',
  'Maintainer': 'Jendrik Seipp <xxxxxxxx@xxxxxx.com>',
  'Package': 'com.github.jendrikseipp.rednotebook-elementary',
  'Priority': 'optional',
  'Recommends': 'python3-enchant',
  'Section': 'text',
  'Source': 'com.github.jendrikseipp.rednotebook-elementary',
  'Standards-Version': '3.9.6',
  'Vcs-Browser': 'https://github.com/jendrikseipp/rednotebook',
  'Vcs-Git': 'git://github.com/jendrikseipp/rednotebook.git'
}

let testingDir: string

beforeAll(async () => {
  testingDir = await tmp('worker/task/debian')
})

test('returns empty object when file does not exist', async () => {
  const parser = new Parser('/thisfile/should/never/exist')

  const data = await parser.read()
  expect(data).toEqual({})
})

test('can figure out simple line types', () => {
  const raw = `
simple: this is a simple line
folded: testing,
        folded,
        line,
        options
multi: this is a multi
 line statement
 used for testing
  `.trim()

  expect(Parser.readLineType(raw, 0)).toEqual('simple')
})

test('can figure out folded line types', () => {
  const raw = `
simple: this is a simple line
folded: testing,
        folded,
        line,
        options
multi: this is a multi
 line statement
 used for testing
  `.trim()

  expect(Parser.readLineType(raw, 1)).toEqual('folded')
  expect(Parser.readLineType(raw, 2)).toEqual('folded')
  expect(Parser.readLineType(raw, 3)).toEqual('folded')
  expect(Parser.readLineType(raw, 4)).toEqual('folded')
})

test('can figure out multiline types', () => {
  const raw = `
simple: this is a simple line
folded: testing,
        folded,
        line,
        options
multi: this is a multi
 line statement
 used for testing
  `.trim()

  expect(Parser.readLineType(raw, 5)).toEqual('multiline')
  expect(Parser.readLineType(raw, 6)).toEqual('multiline')
  expect(Parser.readLineType(raw, 7)).toEqual('multiline')
})

test('can read gold1 file', async () => {
  const parser = new Parser(gold1File)

  const data = await parser.read()
  expect(data).toEqual(gold1Data)
})

test('can read gold2 file', async () => {
  const parser = new Parser(gold2File)

  const data = await parser.read()
  expect(data).toEqual(gold2Data)
})
