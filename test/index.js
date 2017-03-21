import test from 'ava'
import path from 'path'

import micro from 'micro'
import fetch from 'isomorphic-fetch'
import listen from 'test-listen'
import nock from 'nock'
import fs from 'fs'

import handler from '../'
import constants from '../constants'

const githubApi = nock(`https://api.github.com`)
  .get(`/repos/${constants.REPO_PATH}/releases`)
  .reply(200, (uri, requestBody, send) => {
    fs.readFile(path.join(__dirname, 'fixtures', 'releases.json'), (error, data) => send(error, JSON.parse(data)))
  })

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

test.after(t => {
  t.truthy(githubApi.isDone())
})
