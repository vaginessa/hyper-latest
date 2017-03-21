const { getLatest, render } = require('./')
const semver = require('semver')
const moment = require('moment')
const prettyBytes = require('pretty-bytes')

const MarkdownCache = require('./markdown-cache')
const markdownCache = new MarkdownCache()

const { APP_NAME, REPO_PATH, downloads } = require('../constants')

const flexBox = (items) => render('div', { class: 'flex' }, items)

function repoHeader () {
  const [organizationName, repoName] = REPO_PATH.split('/')

  return [
    render('a', { href: `https://github.com/${organizationName}/`, title: organizationName, class: 'repo repo--org' }, organizationName),
    render('span', { class: 'repo repo--separator' }, '/'),
    render('a', { href: `https://github.com/${REPO_PATH}/`, title: repoName, class: 'repo repo--name' }, repoName)
  ].join('')
}

const Header = ({ tags = '', right = '', page = '' }) => flexBox([
  render('h2', { class: 'text--thin' }, [tags, repoHeader(), page].join(' ')),
  render('div', { class: 'header--right' }, right)
])

function getDownloadLinks (release, version) {
  const asstesFiles = release.assets && release.assets.map(asset => asset.name.toLowerCase())

  const links = downloads
    .filter(download => asstesFiles.find(asset => asset.includes(download.extension.toLowerCase())))
    .map(download => {
      const { platform, extension } = download
      const asset = release.assets.find(asset => asset.name.toLowerCase().includes(download.extension.toLowerCase()))

      const downloadPath = version === 'latest' ? `/latest/${extension}` : `/releases/${version}/${extension}`

      const link = render('a', { href: downloadPath, title: `Download ${APP_NAME} for ${platform}` }, downloadPath)
      const name = render('b', null, platform)
      const hint = render('i', null, `(${extension})`)
      return render('li', null, flexBox([
        render('div', null, `${name} ${hint}: ${link}`),
        render('div', { class: 'a--shade a--bytes' }, prettyBytes(asset.size))
      ]))
    })

  return render('ul', null, links)
}

function downloadsView (req, res, { release, isLatestVersion }) {
  const version = isLatestVersion ? 'latest' : release.tag_name
  const links = getDownloadLinks(release, version)

  const versionTag = render('span', { class: 'tag' }, release.tag_name)

  const releaseNotesHref = isLatestVersion ? '/release' : `/release/${version}`
  const releaseNotesLink = render('a', { class: 'a--changelog', href: releaseNotesHref }, [versionTag, 'Release notes'])
  const githubLink = render('a', { class: 'a--shade', href: `https://github.com/${REPO_PATH}` }, 'Github')
  const versionsLink = render('a', { class: 'a--shade', href: '/releases' }, 'All releases')

  const content = [
    links,
    render('div', { class: 'flex' }, [releaseNotesLink, versionsLink, githubLink])
  ].join(render('br'))

  const publishedAt = moment(release.published_at)
  const timeStamp = isLatestVersion ? render('span', { class: 'a--shade', title: publishedAt.format('YYYY-MM-DD HH:mm') }, publishedAt.fromNow()) : ''

  return [
    Header({ right: timeStamp }),
    content
  ].join('')
}

const isMilestone = (tagName) => semver.valid(tagName) && semver.minor(tagName) === 0 && semver.patch(tagName) === 0

async function versionsView (req, res, releases) {
  const latestRelease = getLatest(releases)

  const links = releases.map(release => {
    const href = `/versions/${release.tag_name}`

    const latestTag = release.tag_name === latestRelease.tag_name ? '(latest)' : ''
    const milestone = isMilestone(release.tag_name) ? '🎉' : ''

    const publishedAt = moment(release.published_at)

    return render('li', null, [
      render('a', { href }, render('b', null, `${release.tag_name} ${latestTag}`)),
      render('span', null, milestone),
      render('span', { title: publishedAt.format('YYYY-MM-DD HH:mm') }, ` - ${publishedAt.fromNow()}`)
    ])
  })

  const releaseCount = render('span', { class: 'text--thin' }, ` (${links.length})`)
  const releasesLink = render('a', { href: `https://github.com/${REPO_PATH}/releases`, class: 'text--thin a--repolink' }, ' releases ')
  const githubLink = render('a', { class: 'a--shade text--thin a--repolink', target: '_BLANK', href: `https://github.com/${REPO_PATH}/releases` }, 'open in github')

  const header = Header({
    page: `${releasesLink} ${releaseCount}`,
    right: githubLink
  })

  return [
    render('div', null, header),
    render('ul', null, links)
  ].join('')
}

function releaseView (req, res, { release, isLatestVersion }) {
  const version = isLatestVersion ? 'latest' : release.tag_name
  const versionTag = render('span', { class: 'tag' }, release.tag_name)

  const githubLink = render('a', { class: 'a--shade text--thin a--repolink', target: '_BLANK', href: release.html_url }, 'open in github')

  const markdown = markdownCache.get(release)

  const header = Header({
    tags: versionTag,
    page: `release notes`,
    right: githubLink
  })

  return [
    render('div', null, header),
    render('div', null, markdown),
    render('br'),
    render('h3', null, render('a', { href: '#downloads', class: 'a--relative' }, `Downloads`)),
    render('div', { id: 'downloads' }, getDownloadLinks(release, version)),
    render('br'),
    render('br')
  ].join('')
}

module.exports = async function viewController (req, res, { version, releases, cache }) {
  const isLatestVersion = version === 'latest'

  if (version) {
    const latestRelease = getLatest(releases)
    const release = isLatestVersion ? latestRelease : releases.find(release => release.tag_name === version)
    return releaseView(req, res, { release, isLatestVersion: latestRelease.tag_name === release.tag_name })
  }

  if (req.url.startsWith('/versions')) return versionsView(req, res, releases)
  if (req.url.startsWith('/releases')) return versionsView(req, res, releases)
  if (req.url.startsWith('/release')) return releaseView(req, res, { release: getLatest(releases), isLatestVersion: true })
  if (req.url.startsWith('/stats')) {
    return cache.stats()
  }

  return downloadsView(req, res, { release: getLatest(releases), isLatestVersion: true })
}
