const micro = require('micro')
const semver = require('semver')
const debug = require('debug')('github-releases')

const { REPO_PATH, downloads } = require('./constants')
const { getLatest, forwardUrl, setHtml, render } = require('./lib')
const styleSheet = require('./lib/styles')
const viewController = require('./lib/view-controller')

const ReleaseCache = require('./lib/release-cache')
const cache = new ReleaseCache({ repoPath: REPO_PATH })

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
  const releases = await cache.getReleases()
  const paths = req.url.split('/')
  const platform = paths.find(isPlatform)
  const version = paths.find(isVersion)
  const isLatestVersion = version === 'latest'

  debug(`Incoming request for platform: "${platform}", version: "${version}"`)

  if (version && platform) {
    const release = isLatestVersion ? getLatest(releases) : releases.find(release => release.tag_name === version)

    if (!release) {
      micro.send(res, 404, `No release found matching version: ${JSON.stringify(version)}`)
      return
    }

    if (platform) return downloadRedirect(req, res, { release, platform })
  }

  return viewController(req, res, { releases, version, platform, cache })
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
