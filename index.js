const micro = require('micro')
const { send } = micro
const fetch = require('isomorphic-fetch')
const semver = require('semver')
const ms = require('ms')
const debug = require('debug')('github-releases')

const { getLatest, forwardUrl, setHtml, render, styleSheet } = require('./lib')
const viewController = require('./lib/view')
const { REPO_PATH, downloads } = require('./constants')

let cache = null

const fetchReleases = () => fetch(`https://api.github.com/repos/${REPO_PATH}/releases`)
  .then(response => response.json())
  .catch(error => { console.error('error fetching releases:', error) })

async function cacheReleases () {
  const releases = await fetchReleases()

  // Don't update cache if we don't get data from github
  if (Array.isArray(releases)) {
    cache = releases
    return releases
  }

  return Array.isArray(cache) ? cache : []
}

setInterval(cacheReleases, ms('15m'))

const getReleases = () => Array.isArray(cache) ? Promise.resolve(cache) : cacheReleases()

const fallbackRedirect = (res) => forwardUrl(res, `https://github.com/${REPO_PATH}/releases`)

const downloadRedirect = (req, res, { platform, release }) => {
  try {
    const requestedAsset = release.assets.find(asset => asset.name.toLowerCase().includes(platform.toLowerCase()))
    forwardUrl(res, requestedAsset.browser_download_url)
  } catch (error) {
    console.error('error downloadRedirect:', error)
    fallbackRedirect(res)
  }
}

const isPlatform = value => value !== '' && downloads.some(download => download.extension.toLowerCase().includes(value.toLowerCase()))
const versionRegex = /\d\.\d\.\d/
const isVersion = path => path !== '' && (path === 'latest' || (path.match(versionRegex) && semver.valid(path)))

async function router (req, res) {
  const releases = await getReleases()
  const paths = req.url.split('/')

  const platform = paths.find(isPlatform)
  const version = paths.find(isVersion)
  const isLatestVersion = version === 'latest'

  debug(`Incoming request for platform: "${platform}", version: "${version}"`)

  if (version && platform) {
    const release = isLatestVersion ? getLatest(releases) : releases.find(release => release.tag_name === version)

    if (!release) {
      send(res, 404, `No release found matching version: ${JSON.stringify(version)}`)
      return
    }

    if (platform) return downloadRedirect(req, res, { release, platform })
  }

  return viewController(req, res, { releases, version, platform })
}

const handler = async (req, res) => {
  const result = await router(req, res)

  if (typeof result === 'string') {
    setHtml(res)
    return [
      render('title', null, REPO_PATH),
      `<style>${styleSheet}</style>`,
      render('div', { class: 'content' }, result)
    ].join('\n')
  }

  return result
}

if (require.main === module) {
  const server = micro(handler)
  server.listen(3000)
} else {
  module.exports = handler
}
