const marky = require('marky-markdown')
const { render } = require('./')

const linkUsername = username => render('a', { target: '_BLANK', class: 'github--user', href: `https://github.com/${username.replace('@', '')}` }, username)

function generateMarkdown (release) {
  const markdown = marky(release.body)
    .replace(/@[A-z]+/g, linkUsername)

  return markdown
}

module.exports = class MarkDownCache extends Map {
  get (release) {
    if (super.has(release.id)) {
      return super.get(release.id)
    }

    const markdown = generateMarkdown(release)
    super.set(release.id, markdown)
    return markdown
  }
}
