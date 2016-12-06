/**
 * test/flightcheck/parsers/xml.js
 * Tests the ability to read and write from a xml file
 */

import test from 'ava'

import * as xml from 'flightcheck/parsers/xml'

test('can read a file', async (t) => {
  const one = await xml.read(`
    <root>
        <head>testing</head>
        <body>
            <div>testing div</div>
            <div>this is valid xml</div>
        </body>
    </root>
  `)

  t.is(one['root']['head'][0], 'testing')
  t.is(one['root']['body'][0]['div'][0], 'testing div')
})

test('can write a file', async (t) => {
  const one = await xml.write({
    root: {
      head: ['testing'],
      body: [{
        div: ['testing div', 'this is valid xml']
      }]
    }
  })

  t.is(one, [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<root>',
    '  <head>testing</head>',
    '  <body>',
    '    <div>testing div</div>',
    '    <div>this is valid xml</div>',
    '  </body>',
    '</root>'
  ].join('\n'))
})
