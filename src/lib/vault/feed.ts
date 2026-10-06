import { formatDay } from '@/lib/dates'
import type { JourneyEntry, Project, Vault } from './index'
import { escapeHtml } from './html'

// RSS 2.0 for the Projects feed (every Journey entry) and each Project feed. Items carry the full
// entry, use the permanent entry id as their guid (so editing a title never re-notifies anyone),
// and link to the entry's anchor on its Project page.

export type FeedSite = { url: string; handle: string }

type Item = { project: Project; entry: JourneyEntry }

const newestFirst = (a: Item, b: Item) =>
  b.entry.date.localeCompare(a.entry.date) ||
  b.entry.anchor.localeCompare(a.entry.anchor, 'en', { numeric: true }) ||
  a.project.name.localeCompare(b.project.name)

/** Site-relative href/src/srcset URLs made absolute, so feed readers can follow them. */
function absolutise(html: string, origin: string) {
  return html
    .replace(/\b(href|src)="\/(?!\/)/g, `$1="${origin}/`)
    .replace(/\bsrcset="([^"]*)"/g, (_, set: string) => `srcset="${set.replace(/(^|,\s*)\/(?!\/)/g, `$1${origin}/`)}"`)
}

const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`

function entryTitle(e: JourneyEntry) {
  return e.title ?? `Journey entry · ${formatDay(e.date)}`
}

function channel(o: {
  site: FeedSite
  title: string
  description: string
  page: string
  self: string
  items: Item[]
  prefix: boolean
}) {
  const origin = o.site.url.replace(/\/$/, '')
  const items = o.items.map(({ project, entry }) => {
    const link = `${origin}/project/${project.slug}#${entry.anchor}`
    const title = o.prefix ? `${project.name}: ${entryTitle(entry)}` : entryTitle(entry)
    return [
      '    <item>',
      `      <title>${escapeHtml(title)}</title>`,
      `      <link>${escapeHtml(link)}</link>`,
      `      <guid isPermaLink="false">${escapeHtml(entry.id)}</guid>`,
      `      <pubDate>${new Date(`${entry.date}T00:00:00Z`).toUTCString()}</pubDate>`,
      `      <category>${escapeHtml(project.name)}</category>`,
      `      <description>${cdata(absolutise(entry.html, origin))}</description>`,
      '    </item>',
    ].join('\n')
  })
  const newest = o.items[0]?.entry.date
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeHtml(o.title)}</title>`,
    `    <link>${escapeHtml(origin + o.page)}</link>`,
    `    <description>${escapeHtml(o.description)}</description>`,
    '    <language>en</language>',
    `    <atom:link href="${escapeHtml(origin + o.self)}" rel="self" type="application/rss+xml"/>`,
    ...(newest ? [`    <lastBuildDate>${new Date(`${newest}T00:00:00Z`).toUTCString()}</lastBuildDate>`] : []),
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}

export function projectsFeed(vault: Vault, site: FeedSite) {
  return channel({
    site,
    title: `${site.handle} · Projects`,
    description: `Every Journey entry from ${site.handle}'s side projects.`,
    page: '/projects',
    self: '/projects/rss.xml',
    items: vault.projects.flatMap((project) => project.entries.map((entry) => ({ project, entry }))).sort(newestFirst),
    prefix: true,
  })
}

export function projectFeed(project: Project, site: FeedSite) {
  return channel({
    site,
    title: `${site.handle} · ${project.name}`,
    description: project.summary,
    page: `/project/${project.slug}`,
    self: `/project/${project.slug}/rss.xml`,
    items: project.entries.map((entry) => ({ project, entry })),
    prefix: false,
  })
}
