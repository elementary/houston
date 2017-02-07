/**
 * test/service/index.js
 * Tests common aspects of third party service files
 */

import test from 'ava'

import * as service from 'service'

test('nameify converts as expected', (t) => {
  const one = service.nameify('avalidname')
  const two = service.nameify('not.a.valid.name')
  const three = service.nameify('yo*$Jf(C#@j-____-j23f2390f)')
  const four = service.nameify("cody's app ٩(̾●̮̮̃̾•̃̾)۶")
  const five = service.nameify('i got a cool\nmultiline\napp!')

  t.is(one, 'avalidname')
  t.is(two, 'not-a-valid-name')
  t.is(three, 'yojfcj-j23f2390f')
  t.is(four, 'codys-app')
  t.is(five, 'i-got-a-cool-multiline-app')
})
