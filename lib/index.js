const semver = require('semver')

module.exports.getLatest = function getLatest (releases) {
  return releases.reduce((latestRelease, release) => {
    if (!release || release.draft || release.prerelease) return latestRelease

    if (!latestRelease) return release

    if (!release.tag_name) {
      console.error('Missing tag_name for release', release)
      return latestRelease
    }

    if (semver.gt(release.tag_name, latestRelease.tag_name)) return release
    return latestRelease
  })
}

module.exports.forwardUrl = function forwardUrl (res, location) {
  res.statusCode = 302
  res.setHeader('Location', location)
  res.end()
}

module.exports.setHtml = (res) => res.setHeader('Content-Type', 'text/html')

module.exports.render = render
function render (type = 'div', props, children) {
  if (type === 'br') return '<br />'
  if (!children && (typeof props === 'string' || Array.isArray(props))) children = props

  const propKeys = props ? Object.keys(props) : []

  const propString = propKeys
    .map((key) => `${key}="${props[key]}"`)
    .join(' ')

  // Make the html look "pretty"
  const paddedPropString = propString ? ` ${propString}` : ''

  if (!children) return `<${type}${paddedPropString}/>`
  if (typeof children === 'string') children = children.replace(/\n/g, render('br'))
  if (Array.isArray(children)) children = children.join('')

  return `<${type}${paddedPropString}>${children}</${type}>`
}
