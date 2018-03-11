/**
 * test/flightcheck/file/parsers/colon.js
 * Tests the ability to read and write from a colon seperated file
 */

import test from 'ava'

import * as colon from 'flightcheck/file/parsers/colon'

test('can read a file', async (t) => {
  const one = await colon.read(`
    Source: vocal
    Section: sound
    Priority: optional
    Maintainer: Nathan Dyer
    Build-Depends: cmake (>= 2.8),
                   debhelper (>= 8.0.0),
                   libgee-0.8-dev,
                   libgranite-dev,
                   libgtk-3-dev (>= 3.14),
                   valac (>= 0.18.1),
                   libunity-dev,
                   libnotify-dev,
                   libxml2-dev,
                   libgstreamer1.0-dev,
                   libgstreamer-plugins-base1.0-dev,
                   libclutter-gtk-1.0-dev,
                   libclutter-1.0-dev,
                   libclutter-gst-3.0-dev,
                   libsqlite3-dev,
                   libsoup2.4-dev,
                   libwebkit2gtk-3.0-dev

    Standards-Version: 3.9.3
    Package: vocal
    Architecture: any
    Depends: \${misc:Depends}, \${shlibs:Depends}
    Description: Vocal
     Simple podcast client for the modern desktop.
  `)

  t.is(one['Source'], 'vocal')
  t.is(one['Maintainer'], 'Nathan Dyer')
  // eslint-disable-next-line no-template-curly-in-string
  t.is(one['Depends'], '${misc:Depends}, ${shlibs:Depends}')
  t.is(one['Description'], 'Vocal\nSimple podcast client for the modern desktop.')

  t.is(typeof one['Build-Depends'], 'object')
  t.is(one['Build-Depends'].length, 17)
  t.true(one['Build-Depends'].includes('libgranite-dev'))
})

test('can write a file', async (t) => {
  const one = await colon.write({
    Source: 'vocal',
    Section: 'sound',
    Priority: 'optional',
    Maintainer: 'Nathan Dyer',
    'Build-Depends': ['cmake (>= 2.8)', 'debhelper (>= 8.0.0)', 'libgee-0.8-dev'],
    'Standards-Version': '3.9.3',
    Package: 'vocal',
    Architecture: 'any',
    // eslint-disable-next-line no-template-curly-in-string
    Depends: '${misc:Depends}, ${shlibs:Depends}',
    Description: 'Vocal\n Simple podcast client for the modern desktop.'
  })

  t.is(one, [
    'Source: vocal',
    'Maintainer: Nathan Dyer',
    'Section: sound',
    'Priority: optional',
    'Standards-Version: 3.9.3',
    'Build-Depends: cmake (>= 2.8),',
    '               debhelper (>= 8.0.0),',
    '               libgee-0.8-dev',
    '',
    'Package: vocal',
    'Architecture: any',
    // eslint-disable-next-line no-template-curly-in-string
    'Depends: ${misc:Depends}, ${shlibs:Depends}',
    'Description: Vocal',
    '  Simple podcast client for the modern desktop.',
    ''
  ].join('\n'))
})
