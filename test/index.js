import test from 'ava'

import micro from 'micro'
import handler from '../'
import fetch from 'isomorphic-fetch'
import listen from 'test-listen'
import constants from '../constants'

const app = micro(handler)

let url
test.before(async t => {
  url = await listen(app)
})

test('Server responds', async (t) => {
  const res = await fetch(url)
  t.is(res.status, 200)
  t.truthy(res)
})

for (const download of constants.downloads) {
  test(`Redirect to latest .${download.extension}`, async (t) => {
    const res = await fetch(`${url}/latest/${download.extension}`)
    t.is(res.status, 200)
    t.truthy(res.url.includes(download.extension))
  })
}
