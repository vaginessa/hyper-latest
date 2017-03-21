const ms = require('ms')
const fetch = require('isomorphic-fetch')
const parseLink = require('github-parse-link')
const flatMap = require('lodash.flatmap')

const fetchReleases = async (repoPath) => {
  const response = await fetch(`https://api.github.com/repos/${repoPath}/releases`)
  const firstPageJson = await response.json()
  const link = response.headers.get('link')

  if (!link) return firstPageJson

  const parsed = parseLink(response.headers.get('link'))
  const [count] = parsed.last.match(/\d+$/)

  if (count === 1) return firstPageJson

  const rest = await Promise.all(
    Array.from(Array(count - 1))
      .map((_, index) => index + 2)
      .map(index => {
        return fetch(`https://api.github.com/repos/${repoPath}/releases?page=${index}`)
          .then(res => res.json())
      })
  )

  return flatMap([firstPageJson, ...rest])
}

const expandTimers = (ms) => ({
  ms,
  seconds: Math.round(ms / 1000),
  minutes: Math.round(ms / 1000 / 60)
})

module.exports = class ReleaseCache {
  constructor ({ repoPath, fetchInterval = '15m', store } = {}) {
    if (!repoPath) throw new Error('repoPath is required')

    this.store = store || null
    this.repoPath = repoPath
    this.fetchCount = 0

    this.fetchIntervalMs = ms(fetchInterval)
    this.nextFetch = Date.now() + this.fetchIntervalMs

    this.interval = setInterval(() => {
      this.nextFetch = Date.now() + this.fetchIntervalMs
      this.refetch()
    }, this.fetchIntervalMs)
  }

  async refetch () {
    const releases = await fetchReleases(this.repoPath)
    this.fetchCount = this.fetchCount + 1

    if (Array.isArray(releases)) {
      this.store = releases
      this.updatedAt = Date.now()
      return releases
    }

    return Array.isArray(this.store) ? this.store : []
  }

  stats () {
    const nextFetchMs = this.nextFetch ? this.nextFetch - Date.now() : 0
    const ms = this.updatedAt ? Date.now() - this.updatedAt : 0

    return { sinceLastUpdate: expandTimers(ms), nextFetchIn: expandTimers(nextFetchMs), fetchCount: this.fetchCount }
  }

  getReleases () {
    if (Array.isArray(this.store)) return Promise.resolve(this.store)
    return this.refetch()
  }
}
