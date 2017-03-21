const { getLatest, render } = require('./')
const { APP_NAME, REPO_PATH, downloads } = require('../constants')

function getDownloadLinks (version) {
  const links = downloads
    .map(download => {
      const { platform, extension } = download
      const downloadPath = version === 'latest' ? `/latest/${extension}` : `/releases/${version}/${extension}`

      const link = render('a', { href: downloadPath, title: `Download ${APP_NAME} for ${platform}` }, downloadPath)
      const name = render('b', null, platform)
      const hint = render('i', null, `(${extension})`)
      return render('li', null, `${name} ${hint}: ${link}`)
    })

  return render('ul', null, links)
}

function downloadsView (req, res, release, isLatestVersion) {
  const version = isLatestVersion ? 'latest' : release.tag_name
  const links = getDownloadLinks(version)

  const repoLink = render('a', { class: 'a--repolink', href: `https://github.com/${REPO_PATH}` }, REPO_PATH)
  const versionTag = render('span', { class: 'tag' }, release.tag_name)

  const releaseNotesHref = isLatestVersion ? '/release' : `/release/${version}`
  const releaseNotesLink = render('a', { class: 'a--changelog', href: releaseNotesHref }, [versionTag, 'Release notes'])
  const githubLink = render('a', { class: 'a--changelog a--shade', href: `https://github.com/${REPO_PATH}` }, 'Github')
  const versionsLink = render('a', { class: 'a--changelog a--shade', href: '/versions' }, 'All versions')

  const content = [
    links,
    render('div', { class: 'flex' }, [releaseNotesLink, versionsLink, githubLink])
  ].join(render('br'))

  return [
    render('h2', null, repoLink),
    content
  ].join('')
}

async function versionsView (req, res, releases) {
  const links = releases.map(release => {
    const href = `/versions/${release.tag_name}`
    return render('a', { href }, [render('b', null, release.tag_name)])
  })

  return [
    render('h2', null, 'Releases'),
    ...links
  ].join(render('br'))
}

function releaseView (req, res, release, isLatestVersion) {
  const version = isLatestVersion ? 'latest' : release.tag_name
  const versionTag = render('span', { class: 'tag' }, release.tag_name)
  const latestTag = isLatestVersion ? render('i', null, '(latest)') : ''
  return [
    render('h2', null, `${versionTag} ${REPO_PATH} ${latestTag} release notes  `),
    render('div', null, release.body),
    render('br'),
    render('h3', null, `Downloads`),
    getDownloadLinks(version)
  ].join('')
}

module.exports = async function viewController (req, res, { version, releases, cache }) {
  const isLatestVersion = version === 'latest'

  if (version) {
    const release = isLatestVersion ? getLatest(releases) : releases.find(release => release.tag_name === version)
    return releaseView(req, res, release, isLatestVersion)
  }

  const latestRelease = getLatest(releases)

  if (req.url.startsWith('/versions')) return versionsView(req, res, releases)
  if (req.url.startsWith('/releases')) return versionsView(req, res, releases)
  if (req.url.startsWith('/release')) return releaseView(req, res, latestRelease, true)
  if (req.url.startsWith('/stats')) {
    const stats = cache.stats()
    return stats
  }

  return downloadsView(req, res, latestRelease, true)
}
