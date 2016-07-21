/**
 * tests/flightcheck/parsers/colon.js
 * Tests the ability to read and write from colon seperated files
 */

import chai from 'chai'

import * as colon from '~/flightcheck/parsers/colon'

const assert = chai.assert

describe('colon', () => {
  it('can read a simple file', async (done) => {
    const obj = await colon.read(`
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

    assert.equal(obj['Source'], 'vocal')
    assert.isArray(obj['Build-Depends'])
    assert.lengthOf(obj['Build-Depends'], 17)
    assert.equal(obj['Build-Depends'][3], 'libgranite-dev')
    assert.equal(obj['Maintainer'], 'Nathan Dyer')
    assert.equal(obj['Depends'], '${misc:Depends}, ${shlibs:Depends}')
    assert.equal(obj['Description'], 'Vocal\n       Simple podcast client for the modern desktop.')

    done()
  })

  it('can write a simple file', async (done) => {
    const str = await colon.write({
      Source: 'vocal',
      Section: 'sound',
      Priority: 'optional',
      Maintainer: 'Nathan Dyer',
      'Build-Depends': ['cmake (>= 2.8)', 'debhelper (>= 8.0.0)', 'libgee-0.8-dev'],
      'Standards-Version': '3.9.3',
      Package: 'vocal',
      Architecture: 'any',
      Depends: '${misc:Depends}, ${shlibs:Depends}',
      Description: 'Vocal\n Simple podcast client for the modern desktop.'
    })

    assert.equal(str, [
      'Source: vocal',
      'Section: sound',
      'Priority: optional',
      'Maintainer: Nathan Dyer',
      'Build-Depends: cmake (>= 2.8),',
      '               debhelper (>= 8.0.0),',
      '               libgee-0.8-dev',
      '',
      'Standards-Version: 3.9.3',
      'Package: vocal',
      'Architecture: any',
      'Depends: ${misc:Depends}, ${shlibs:Depends}',
      'Description: Vocal',
      ' Simple podcast client for the modern desktop.',
      ''
    ].join('\n'))

    done()
  })
})
