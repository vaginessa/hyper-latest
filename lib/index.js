const semver = require('semver')

module.exports.getLatest = function getLatest (releases = []) {
  return releases.reduce((latestRelease, release) => {
    if (!release) return latestRelease
    if (release.draft || release.prerelease) return latestRelease
    if (!latestRelease) return release
    if (!release.tag_name) return latestRelease

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

  if (!children) return `<${type} ${propString} />`
  if (typeof children === 'string') children = children.replace(/\n/g, render('br'))
  if (Array.isArray(children)) children = children.join('')

  return `<${type} ${propString}>${children}</${type}>`
}

module.exports.styleSheet = `
  * { box-sizing: border-box; }
  body, html {
    padding: 0;
  }

  a {
    color: #FF2E88;
    transition: 300ms ease;
  }

  a:visited {
    opacity: 0.8;
  }

  a:hover {
    color: #50E3C2;
  }

  .a--changelog, .a--repolink {
    text-decoration: none;
    color: #FFF;
  }

  .a--changelog .tag {
    margin-right: 10px;
  }

  a:hover .tag {
    opacity: .9;
  }

  .a--shade {
    color: #333;
    font-weight: 300;
  }

  .tag {
    border-radius: 3px;
    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%, rgba(254,30,173,1)), color-stop(100%, #E76027));
    padding: 1px 6px;
    color: #FFF;
    font-weight: 200;
    transition: 300ms ease;
  }

  i {
    font-style: normal;
    opacity: .9;
    font-weight: 200;
  }

  ul {
    padding: 0;
  }

  li {
    list-style: none;
  }

  body {
    font-family: sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
    color: #FFF;
  }

  .content {
    max-width: 800px;
  }

  img {
    max-width: 100%;
    margin: 40px;
  }

  .flex {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
`
