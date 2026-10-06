import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { marked } from 'marked'
import { z } from 'zod'
import { MAX_DEPTH } from '@/lib/depth'

// Every file in content/ is parsed with gray-matter and checked against a schema here.
// A bad field fails the build with the file name and the field that's wrong.

const CONTENT_DIR = path.join(process.cwd(), 'content')

// YAML turns 2025-06-01 into a Date; accept either form and normalise to "YYYY-MM".
const yearMonth = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 7) : v),
  z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM, e.g. 2025-06'),
)

const link = z.object({ label: z.string(), href: z.string() })

const siteSchema = z.object({
  handle: z.string(),
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  status: z.string().optional(),
  location: z.string().optional(),
  email: z.email().optional(),
  url: z.url(),
  links: z.array(link).default([]),
  resume: z.string().optional(),
})

export const SECTION_IDS = ['now', 'work', 'education', 'projects', 'talks', 'awards', 'offscreen'] as const
export type SectionId = (typeof SECTION_IDS)[number]

const sectionsSchema = z.object({
  sections: z.array(
    z.object({
      id: z.enum(SECTION_IDS),
      title: z.string(),
      depth: z.number().min(0).max(MAX_DEPTH),
    }),
  ),
})

const experienceSchema = z.object({
  role: z.string(),
  company: z.string(),
  companyUrl: z.url().optional(),
  type: z.string().optional(),
  start: yearMonth,
  end: yearMonth.optional(),
})

const educationSchema = z.object({
  degree: z.string(),
  school: z.string(),
  schoolUrl: z.url().optional(),
  type: z.string().optional(),
  start: yearMonth,
  end: yearMonth.optional(),
  meta: z.string().optional(),
})

const listOf = <T extends z.ZodType>(item: T) => z.object({ items: z.array(item).default([]) })

const nowSchema = listOf(z.string())
const talksSchema = listOf(z.object({ title: z.string(), event: z.string(), date: yearMonth, url: z.url().optional() }))
const writingSchema = listOf(
  z.object({ title: z.string(), publication: z.string().optional(), date: yearMonth, url: z.url().optional() }),
)
const awardsSchema = listOf(z.object({ year: z.number(), title: z.string(), result: z.string() }))
const offscreenSchema = listOf(z.object({ title: z.string(), text: z.string() }))

function readFile<T extends z.ZodType>(file: string, schema: T) {
  const full = path.join(CONTENT_DIR, file)
  const { data, content } = matter(fs.readFileSync(full, 'utf8'))
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    throw new Error(`Invalid frontmatter in content/${file}:\n${z.prettifyError(parsed.error)}`)
  }
  return { data: parsed.data as z.output<T>, html: renderBody(content) }
}

function readDir<T extends z.ZodType>(dir: string, schema: T) {
  return fs
    .readdirSync(path.join(CONTENT_DIR, dir))
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ slug: f.replace(/\.md$/, ''), ...readFile(path.join(dir, f), schema) }))
}

function renderBody(md: string) {
  const trimmed = md.trim()
  return trimmed ? (marked.parse(trimmed, { async: false }) as string) : ''
}

// Newest start first; on a tie the ongoing (no end date) entry wins.
const byRecency = (a: { start: string; end?: string }, b: { start: string; end?: string }) =>
  b.start.localeCompare(a.start) || (b.end ?? '9999').localeCompare(a.end ?? '9999')

export type TimelineEntry = {
  slug: string
  title: string
  org: string
  orgUrl?: string
  type?: string
  start: string
  end?: string
  meta?: string
  html: string
}

export function getContent() {
  const site = readFile('site.md', siteSchema).data
  const { sections } = readFile('sections.md', sectionsSchema).data

  const work: TimelineEntry[] = readDir('experience', experienceSchema)
    .map(({ slug, data, html }) => ({
      slug,
      title: data.role,
      org: data.company,
      orgUrl: data.companyUrl,
      type: data.type,
      start: data.start,
      end: data.end,
      html,
    }))
    .sort(byRecency)

  const education: TimelineEntry[] = readDir('education', educationSchema)
    .map(({ slug, data, html }) => ({
      slug,
      title: data.degree,
      org: data.school,
      orgUrl: data.schoolUrl,
      type: data.type,
      start: data.start,
      end: data.end,
      meta: data.meta,
      html,
    }))
    .sort(byRecency)

  const talks = [
    ...readFile('talks.md', talksSchema).data.items.map((t) => ({ ...t, kind: 'Talk' as const, where: t.event })),
    ...readFile('writing.md', writingSchema).data.items.map((w) => ({
      ...w,
      kind: 'Article' as const,
      where: w.publication ?? 'Article',
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  return {
    site,
    sections,
    now: readFile('now.md', nowSchema).data.items,
    work,
    education,
    talks,
    awards: readFile('awards.md', awardsSchema).data.items,
    offscreen: readFile('offscreen.md', offscreenSchema).data.items,
  }
}

export type Content = ReturnType<typeof getContent>
export type Section = Content['sections'][number]
