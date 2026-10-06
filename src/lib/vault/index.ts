import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { z } from 'zod'
import { type RenderContext, renderMarkdown } from './markdown'

// The Vault reader: a folder of Obsidian notes goes in, Projects come out. Only Published notes
// (in Projects/ and flagged publish: true) are ever read; see docs/adr/0001. Anything wrong in a
// Published note throws with the note's path, so a bad push fails the build instead of the site.

export const STATUSES = ['building', 'paused', 'shipped', 'archived'] as const
export type Status = (typeof STATUSES)[number]

export type JourneyEntry = {
  /** Permanent id: Project slug + date (+ same-day suffix). Never the title, so edits don't re-notify. */
  id: string
  anchor: string
  /** YYYY-MM-DD */
  date: string
  title?: string
  html: string
}

export type Project = {
  slug: string
  /** The note's filename without .md, which is what Obsidian wikilinks use. */
  noteName: string
  name: string
  summary: string
  status: Status
  /** YYYY-MM */
  started?: string
  links: { label: string; href: string }[]
  tags: string[]
  intro: string
  /** Newest first. */
  entries: JourneyEntry[]
  /** YYYY-MM-DD of the newest entry, else the first day of `started`. */
  lastUpdate?: string
}

export type Vault = { projects: Project[]; warnings: string[] }

const PROJECTS_DIR = 'Projects'

const yearMonth = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 7) : v),
  z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM, e.g. 2026-03'),
)

const frontmatter = z.object({
  publish: z.literal(true),
  name: z.string().min(1),
  summary: z.string().min(1),
  status: z.enum(STATUSES),
  started: yearMonth.optional(),
  links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
  tags: z.array(z.string()).default([]),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, digits and dashes')
    .optional(),
  cover: z.string().optional(),
})

const ENTRY_HEADING = /^##\s+(\d{4}-\d{2}-\d{2})(?:\s+\((\d+)\))?(?:\s+(.*?))?\s*$/
const FENCE = /^\s*(```|~~~)/

export function slugify(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isRealDate(d: string) {
  const t = new Date(`${d}T00:00:00Z`)
  return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === d
}

/** Markdown files under a directory, recursively, as paths relative to the Vault root. */
function listNotes(root: string, dir: string): string[] {
  const full = path.join(root, dir)
  if (!fs.existsSync(full)) return []
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((e) => {
    const rel = path.join(dir, e.name)
    if (e.isDirectory()) return listNotes(root, rel)
    return e.isFile() && e.name.endsWith('.md') ? [rel] : []
  })
}

type RawEntry = { date: string; suffix: number; title?: string; body: string }

/** Splits a note body into its intro and dated Journey entries, skipping headings in code fences. */
function splitJourney(body: string, where: string) {
  const intro: string[] = []
  const entries: RawEntry[] = []
  let current: RawEntry | null = null
  let fenced = false
  for (const line of body.split('\n')) {
    if (FENCE.test(line)) fenced = !fenced
    const m = !fenced && line.match(ENTRY_HEADING)
    if (m) {
      const [, date, suffix, title] = m
      if (!isRealDate(date)) throw new Error(`${where}: "${date}" in a Journey entry heading is not a real date`)
      current = { date, suffix: suffix ? Number(suffix) : 1, title: title || undefined, body: '' }
      entries.push(current)
    } else if (current) current.body += line + '\n'
    else intro.push(line)
  }
  return { intro: intro.join('\n'), entries }
}

export function readVault(root: string): Vault {
  const warnings: string[] = []
  const published = listNotes(root, PROJECTS_DIR).flatMap((rel) => {
    const { data, content } = matter(fs.readFileSync(path.join(root, rel), 'utf8'))
    if (data.publish !== true) return []
    const parsed = frontmatter.safeParse(data)
    if (!parsed.success) throw new Error(`Invalid frontmatter in ${rel}:\n${z.prettifyError(parsed.error)}`)
    const noteName = path.basename(rel, '.md')
    const slug = parsed.data.slug ?? slugify(noteName)
    if (!slug) throw new Error(`${rel}: can't derive a slug from the filename; set slug: in the frontmatter`)
    return [{ rel, noteName, slug, fm: parsed.data, content }]
  })

  const seen = new Map<string, string>()
  for (const n of published) {
    const other = seen.get(n.slug)
    if (other) throw new Error(`${n.rel} and ${other} both use the slug "${n.slug}"; set a different slug: on one`)
    seen.set(n.slug, n.rel)
  }

  // Wikilinks resolve by note name, as in Obsidian, and only ever to Published notes.
  const bySlug = new Map(published.map((n) => [n.noteName.toLowerCase(), n.slug]))
  const ctx: RenderContext = {
    linkFor: (name) => {
      const slug = bySlug.get(name.toLowerCase())
      return slug ? `/project/${slug}` : undefined
    },
  }

  const projects = published.map(({ rel, noteName, slug, fm, content }): Project => {
    const { intro, entries: raw } = splitJourney(content, rel)
    const ids = new Set<string>()
    const entries = raw
      .map((e): JourneyEntry => {
        const key = e.suffix > 1 ? `${e.date}-${e.suffix}` : e.date
        if (ids.has(key)) {
          throw new Error(`${rel}: two Journey entries for ${key}; mark the later one "## ${e.date} (2) …"`)
        }
        ids.add(key)
        return {
          id: `${slug}/${key}`,
          anchor: `e-${key}`,
          date: e.date,
          title: e.title,
          html: renderMarkdown(e.body, ctx),
        }
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.anchor.localeCompare(a.anchor, 'en', { numeric: true }))
    return {
      slug,
      noteName,
      name: fm.name,
      summary: fm.summary,
      status: fm.status,
      started: fm.started,
      links: fm.links,
      tags: fm.tags,
      intro: renderMarkdown(intro, ctx),
      entries,
      lastUpdate: entries[0]?.date ?? (fm.started ? `${fm.started}-01` : undefined),
    }
  })

  projects.sort((a, b) => (b.lastUpdate ?? '').localeCompare(a.lastUpdate ?? '') || a.name.localeCompare(b.name))
  return { projects, warnings }
}

export { type FeedSite, projectFeed, projectsFeed } from './feed'
