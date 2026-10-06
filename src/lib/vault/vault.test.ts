import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { optimiseImage, projectFeed, projectsFeed, readVault } from '@/lib/vault'

// Every test builds a small Vault on disk and reads it through the public interface only.

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true })
})

function vault(files: Record<string, string | Buffer>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-'))
  dirs.push(root)
  for (const [rel, body] of Object.entries(files)) {
    const full = path.join(root, rel)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, body)
  }
  return root
}

function note(fm: Record<string, unknown>, body = '') {
  const yaml = Object.entries(fm)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n')
  return `---\n${yaml}\n---\n${body}`
}

const base = { name: 'Homeops', summary: 'Home lab as code.', status: 'building', publish: true }

describe('publish filter', () => {
  it('reads only notes in Projects/ that are flagged publish: true', () => {
    const dir = vault({
      'Projects/Homeops.md': note(base),
      'Projects/Draft.md': note({ ...base, name: 'Draft', publish: false }),
      'Projects/Unflagged.md': note({ name: 'Unflagged', summary: 's', status: 'building' }),
      'Journal/Secret.md': note({ ...base, name: 'Secret' }),
      'Secret.md': note({ ...base, name: 'Root secret' }),
    })
    expect(readVault(dir).projects.map((p) => p.name)).toEqual(['Homeops'])
  })

  it('returns no Projects for an empty Vault', () => {
    expect(readVault(vault({ 'README.md': 'hi' })).projects).toEqual([])
  })

  it('returns no Projects when the Vault folder does not exist', () => {
    expect(readVault(path.join(os.tmpdir(), 'no-such-vault-here')).projects).toEqual([])
  })
})

describe('validation', () => {
  it('fails on a missing name, naming the note', () => {
    const dir = vault({ 'Projects/Broken.md': note({ summary: 's', status: 'building', publish: true }) })
    expect(() => readVault(dir)).toThrow(/Projects\/Broken\.md[\s\S]*name/)
  })

  it('fails on an unknown Status', () => {
    const dir = vault({ 'Projects/X.md': note({ ...base, status: 'done' }) })
    expect(() => readVault(dir)).toThrow(/Projects\/X\.md[\s\S]*status/)
  })

  it('fails on a dated heading with an impossible date', () => {
    const dir = vault({ 'Projects/X.md': note(base, '## 2026-13-40 Oops\nText') })
    expect(() => readVault(dir)).toThrow(/Projects\/X\.md[\s\S]*2026-13-40/)
  })

  it('does not validate unpublished notes', () => {
    const dir = vault({ 'Projects/WIP.md': note({ publish: false }) })
    expect(readVault(dir).projects).toEqual([])
  })
})

describe('slugs', () => {
  it('derives the slug from the filename', () => {
    const dir = vault({ 'Projects/Pixel Garden!.md': note({ ...base, name: 'Pixel Garden' }) })
    expect(readVault(dir).projects[0].slug).toBe('pixel-garden')
  })

  it('lets frontmatter pin the slug', () => {
    const dir = vault({ 'Projects/Renamed Note.md': note({ ...base, slug: 'homeops' }) })
    expect(readVault(dir).projects[0].slug).toBe('homeops')
  })

  it('fails when two notes resolve to the same slug', () => {
    const dir = vault({
      'Projects/Homeops.md': note(base),
      'Projects/Other.md': note({ ...base, name: 'Other', slug: 'homeops' }),
    })
    expect(() => readVault(dir)).toThrow(/slug "homeops"/)
  })

  it('fails when no slug can be derived', () => {
    const dir = vault({ 'Projects/โปรเจกต์.md': note(base) })
    expect(() => readVault(dir)).toThrow(/slug/)
  })
})

describe('intro and Journey entries', () => {
  const body = [
    'What it is and why.',
    '',
    '## 2026-03-02 Day one',
    'Inventory.',
    '',
    '## 2026-10-03 Backups survived',
    'Restored in **41 minutes**.',
    '',
    '### A sub-heading inside the entry',
    'More.',
    '',
    '## 2026-09-21',
    'Untitled entry.',
    '',
    '## 2026-09-21 (2) Same day again',
    'Second one.',
  ].join('\n')

  it('treats text before the first dated heading as the intro', () => {
    const p = readVault(vault({ 'Projects/Homeops.md': note(base, body) })).projects[0]
    expect(p.intro).toContain('What it is and why.')
    expect(p.intro).not.toContain('Inventory')
  })

  it('sorts entries newest first, same-day suffixes after the first', () => {
    const p = readVault(vault({ 'Projects/Homeops.md': note(base, body) })).projects[0]
    expect(p.entries.map((e) => [e.date, e.title])).toEqual([
      ['2026-10-03', 'Backups survived'],
      ['2026-09-21', 'Same day again'],
      ['2026-09-21', undefined],
      ['2026-03-02', 'Day one'],
    ])
  })

  it('keeps sub-headings inside their entry', () => {
    const p = readVault(vault({ 'Projects/Homeops.md': note(base, body) })).projects[0]
    expect(p.entries[0].html).toContain('A sub-heading inside the entry')
    expect(p.entries[0].html).toContain('<strong>41 minutes</strong>')
  })

  it('gives each entry an anchor and a permanent id built from the slug and date', () => {
    const p = readVault(vault({ 'Projects/Homeops.md': note(base, body) })).projects[0]
    expect(p.entries.map((e) => [e.id, e.anchor])).toEqual([
      ['homeops/2026-10-03', 'e-2026-10-03'],
      ['homeops/2026-09-21-2', 'e-2026-09-21-2'],
      ['homeops/2026-09-21', 'e-2026-09-21'],
      ['homeops/2026-03-02', 'e-2026-03-02'],
    ])
  })

  it('keeps an entry id stable when its title changes', () => {
    const before = readVault(vault({ 'Projects/H.md': note(base, '## 2026-10-03 Old title\nx') })).projects[0]
    const after = readVault(vault({ 'Projects/H.md': note(base, '## 2026-10-03 New title\nx') })).projects[0]
    expect(after.entries[0].id).toBe(before.entries[0].id)
  })

  it('fails on two entries for the same day without a suffix', () => {
    const dir = vault({ 'Projects/H.md': note(base, '## 2026-10-03 A\nx\n\n## 2026-10-03 B\ny') })
    expect(() => readVault(dir)).toThrow(/2026-10-03/)
  })

  it('ignores dated headings inside code fences', () => {
    const p = readVault(vault({ 'Projects/H.md': note(base, '```md\n## 2026-01-01 Not an entry\n```\n') })).projects[0]
    expect(p.entries).toEqual([])
    expect(p.intro).toContain('Not an entry')
  })

  it('uses the newest entry as the last update, falling back to started', () => {
    const withEntries = readVault(vault({ 'Projects/H.md': note({ ...base, started: '2026-03' }, body) })).projects[0]
    expect(withEntries.lastUpdate).toBe('2026-10-03')
    const none = readVault(vault({ 'Projects/H.md': note({ ...base, started: '2026-03' }) })).projects[0]
    expect(none.lastUpdate).toBe('2026-03-01')
  })

  it('orders Projects by last update, newest first', () => {
    const dir = vault({
      'Projects/Old.md': note({ ...base, name: 'Old' }, '## 2025-01-01 a\nx'),
      'Projects/New.md': note({ ...base, name: 'New' }, '## 2026-05-01 b\ny'),
    })
    expect(readVault(dir).projects.map((p) => p.name)).toEqual(['New', 'Old'])
  })

  it('carries the Project facts from frontmatter', () => {
    const p = readVault(
      vault({
        'Projects/H.md': note({
          ...base,
          status: 'paused',
          started: '2026-03',
          tags: ['docker', 'iac'],
          links: [{ label: 'repo', href: 'https://github.com/wit03/homeops' }],
        }),
      }),
    ).projects[0]
    expect(p).toMatchObject({
      status: 'paused',
      started: '2026-03',
      tags: ['docker', 'iac'],
      links: [{ label: 'repo', href: 'https://github.com/wit03/homeops' }],
    })
  })
})

describe('Obsidian syntax', () => {
  const vaultWith = (body: string) =>
    vault({
      'Projects/Homeops.md': note(base, body),
      'Projects/Pelter.md': note({ ...base, name: 'Pelter', slug: 'pelter-api' }),
      'Projects/Draft.md': note({ ...base, name: 'Draft', publish: false }),
      'Reading list.md': '# private',
    })
  const intro = (body: string) => readVault(vaultWith(body)).projects.find((p) => p.slug === 'homeops')!.intro

  it('turns a wikilink to a published Project into a link to its page', () => {
    expect(intro('Grew out of [[Pelter]].')).toContain('<a href="/project/pelter-api">Pelter</a>')
  })

  it('uses the alias and ignores headings in wikilinks', () => {
    expect(intro('See [[Pelter#Setup|the API]].')).toContain('<a href="/project/pelter-api">the API</a>')
  })

  it('renders wikilinks to unpublished, private or missing notes as plain text', () => {
    const html = intro('[[Draft]], [[Reading list|my reading list]] and [[Nowhere]].')
    expect(html).not.toContain('<a')
    expect(html).toContain('Draft, my reading list and Nowhere.')
  })

  it('renders callouts as styled boxes with their title', () => {
    const html = intro('> [!warning] Mind the cables\n> They are everywhere.')
    expect(html).toMatch(/<aside class="callout" data-callout="warning">/)
    expect(html).toContain('<p class="callout-title">Mind the cables</p>')
    expect(html).toContain('They are everywhere.')
  })

  it('titles a callout from its type when it has no title', () => {
    expect(intro('> [!tip]\n> Back up first.')).toContain('<p class="callout-title">Tip</p>')
  })

  it('leaves ordinary blockquotes alone', () => {
    expect(intro('> Just a quote.')).toContain('<blockquote>')
  })

  it('renders #tags as chips, but not headings, links or code', () => {
    const html = intro('Built with #docker and #home/lab.\n\nSee [docs](https://x.dev/#install) and `#not-a-tag`.')
    expect(html).toContain('<span class="tag-chip">#docker</span>')
    expect(html).toContain('<span class="tag-chip">#home/lab</span>')
    expect(html).toContain('href="https://x.dev/#install"')
    expect(html).toContain('<code>#not-a-tag</code>')
  })

  it('strips block references', () => {
    const html = intro('A line worth linking to ^abc123\n\nSee [[Pelter#^xyz]].')
    expect(html).not.toContain('^abc123')
    expect(html).toContain('A line worth linking to')
    expect(html).toContain('<a href="/project/pelter-api">Pelter</a>')
  })

  it('applies the same rules inside Journey entries', () => {
    const p = readVault(vaultWith('## 2026-10-01 Day\nUsing [[Pelter]] with #docker')).projects.find(
      (x) => x.slug === 'homeops',
    )!
    expect(p.entries[0].html).toContain('<a href="/project/pelter-api">Pelter</a>')
    expect(p.entries[0].html).toContain('class="tag-chip"')
  })
})

describe('feeds', () => {
  const site = { url: 'https://wit03.xyz', handle: 'wit03' }
  const feedVault = () =>
    readVault(
      vault({
        'Projects/Homeops.md': note(
          base,
          'Intro is never a feed item.\n\n## 2026-10-03 Backups survived\nRestored in **41 minutes**. See [[MegaNuts]].\n\n## 2026-09-21\nUntitled.\n\n## 2026-09-21 (2) Same day\nAgain.',
        ),
        'Projects/MegaNuts.md': note({ ...base, name: 'MegaNuts' }, '## 2026-09-30 Nuts bounce\nBoing.'),
      }),
    )
  const items = (xml: string) => [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1])
  const field = (item: string, tag: string) => item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1]

  it('is an RSS 2.0 channel describing every Project', () => {
    const xml = projectsFeed(feedVault(), site)
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain(
      '<atom:link href="https://wit03.xyz/projects/rss.xml" rel="self" type="application/rss+xml"/>',
    )
  })

  it('carries every Journey entry across Projects, newest first, never the intro', () => {
    const titles = items(projectsFeed(feedVault(), site)).map((i) => field(i, 'title'))
    expect(titles).toEqual([
      'Homeops: Backups survived',
      'MegaNuts: Nuts bounce',
      'Homeops: Same day',
      'Homeops: Journey entry · 21 Sep 2026',
    ])
    expect(projectsFeed(feedVault(), site)).not.toContain('Intro is never a feed item')
  })

  it("gives a Project feed only that Project's entries", () => {
    const v = feedVault()
    const xml = projectFeed(
      v.projects.find((p) => p.slug === 'meganuts')!,
      site,
    )
    expect(items(xml).map((i) => field(i, 'title'))).toEqual(['Nuts bounce'])
    expect(xml).toContain('<atom:link href="https://wit03.xyz/project/meganuts/rss.xml"')
  })

  it('uses the permanent entry id as the guid and links to the entry anchor', () => {
    const first = items(projectsFeed(feedVault(), site))[0]
    expect(first).toContain('<guid isPermaLink="false">homeops/2026-10-03</guid>')
    expect(field(first, 'link')).toBe('https://wit03.xyz/project/homeops#e-2026-10-03')
    expect(field(first, 'pubDate')).toBe('Sat, 03 Oct 2026 00:00:00 GMT')
  })

  it('carries the full entry HTML with absolute links', () => {
    const desc = field(items(projectsFeed(feedVault(), site))[0], 'description')!
    expect(desc).toContain('<![CDATA[')
    expect(desc).toContain('<strong>41 minutes</strong>')
    expect(desc).toContain('href="https://wit03.xyz/project/meganuts"')
  })

  it('escapes text so titles with markup stay valid XML', () => {
    const v = readVault(vault({ 'Projects/A.md': note({ ...base, name: 'A & B' }, '## 2026-01-01 <Tags> & stuff\nx') }))
    const xml = projectsFeed(v, site)
    expect(xml).toContain('<title>A &amp; B: &lt;Tags&gt; &amp; stuff</title>')
  })
})

describe('images and Covers', () => {
  let png: Buffer
  let wide: Buffer
  beforeAll(async () => {
    png = await sharp({ create: { width: 400, height: 200, channels: 3, background: '#8196ff' } })
      .png()
      .toBuffer()
    wide = await sharp({ create: { width: 2400, height: 1200, channels: 3, background: '#e3a948' } })
      .png()
      .toBuffer()
  })
  const site = { url: 'https://wit03.xyz', handle: 'wit03' }

  it('renders Obsidian embeds as responsive images with alt text', () => {
    const v = readVault(
      vault({
        'Projects/H.md': note(base, '![[rack.png|The rack under my desk]]'),
        'attachments/rack.png': png,
      }),
    )
    const html = v.projects[0].intro
    expect(html).toMatch(/<img [^>]*alt="The rack under my desk"/)
    expect(html).toMatch(/src="\/media\/[0-9a-f]{12}-400\.webp"/)
    expect(html).toContain('width="400" height="200"')
  })

  it('offers several widths, never wider than the original', () => {
    const v = readVault(vault({ 'Projects/H.md': note(base, '![[big.png|Big]]'), 'big.png': wide }))
    const srcset = v.projects[0].intro.match(/srcset="([^"]*)"/)![1]
    expect(srcset.split(', ').map((s) => s.split(' ')[1])).toEqual(['480w', '960w', '1600w'])
    const small = readVault(vault({ 'Projects/H.md': note(base, '![[s.png|Small]]'), 's.png': png }))
    expect(small.projects[0].intro.match(/srcset="([^"]*)"/)![1]).toMatch(/^\/media\/[0-9a-f]{12}-400\.webp 400w$/)
  })

  it('treats a number after | as Obsidian size, not alt text, and warns about the missing alt', () => {
    const v = readVault(vault({ 'Projects/H.md': note(base, '![[rack.png|300]]'), 'rack.png': png }))
    expect(v.projects[0].intro).toContain('alt=""')
    expect(v.projects[0].intro).toContain('width="300" height="150"')
    expect(v.warnings.join('\n')).toMatch(/Projects\/H\.md.*rack\.png.*alt text/)
  })

  it('renders Markdown images relative to the note', () => {
    const v = readVault(
      vault({ 'Projects/H.md': note(base, '![A diagram](img/my%20diagram.png)'), 'Projects/img/my diagram.png': png }),
    )
    expect(v.projects[0].intro).toMatch(/<img [^>]*alt="A diagram"/)
    expect(v.warnings).toEqual([])
  })

  it('leaves remote images alone', () => {
    const v = readVault(vault({ 'Projects/H.md': note(base, '![Badge](https://img.shields.io/x.svg)') }))
    expect(v.projects[0].intro).toContain('src="https://img.shields.io/x.svg"')
  })

  it('warns and drops an image that is not in the Vault', () => {
    const v = readVault(vault({ 'Projects/H.md': note(base, 'Before ![[missing.png|Gone]] after') }))
    expect(v.projects[0].intro).not.toContain('<img')
    expect(v.warnings.join('\n')).toMatch(/missing\.png.*not found/)
  })

  it('collects only images referenced by Published notes', () => {
    const v = readVault(
      vault({
        'Projects/H.md': note(base, '![[used.png|Used]]'),
        'Projects/Draft.md': note({ ...base, name: 'Draft', publish: false }, '![[draft.png|Draft]]'),
        'Journal/Day.md': '![[private.png]]',
        'used.png': png,
        'draft.png': wide,
        'private.png': png,
      }),
    )
    expect(v.images.map((i) => path.basename(i.source))).toEqual(['used.png'])
  })

  it('picks the Cover from frontmatter, then the first intro image, then none', () => {
    const v = readVault(
      vault({
        'Projects/A.md': note({ ...base, name: 'A', cover: '[[cover.png]]' }, '![[first.png|First]]'),
        'Projects/B.md': note(
          { ...base, name: 'B' },
          'Intro ![[first.png|First]]\n\n## 2026-01-01 x\n![[later.png|Later]]',
        ),
        'Projects/C.md': note({ ...base, name: 'C' }, '## 2026-01-01 x\n![[later.png|Later]]'),
        'cover.png': wide,
        'first.png': png,
        'later.png': png,
      }),
    )
    const cover = (n: string) => v.projects.find((p) => p.name === n)!.cover
    expect(path.basename(cover('A')!.source)).toBe('cover.png')
    expect(path.basename(cover('B')!.source)).toBe('first.png')
    expect(cover('C')).toBeUndefined()
  })

  it('uses absolute image URLs in feeds', () => {
    const v = readVault(
      vault({ 'Projects/H.md': note(base, '## 2026-01-01 Pic\n![[rack.png|Rack]]'), 'rack.png': png }),
    )
    const xml = projectsFeed(v, site)
    expect(xml).toMatch(/src="https:\/\/wit03\.xyz\/media\/[0-9a-f]{12}-400\.webp"/)
    expect(xml).toMatch(/srcset="https:\/\/wit03\.xyz\/media\//)
  })

  it('strips all metadata, GPS included, when optimising', async () => {
    const dir = vault({})
    const photo = path.join(dir, 'photo.jpg')
    await sharp({ create: { width: 64, height: 48, channels: 3, background: '#123456' } })
      .jpeg()
      .withExif({ IFD0: { Copyright: 'wit03' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '13/1 45/1 0/1' } })
      .toFile(photo)
    expect((await sharp(photo).metadata()).exif).toBeDefined()
    const out = await optimiseImage(photo, 480)
    const meta = await sharp(out).metadata()
    expect(meta.format).toBe('webp')
    expect(meta.exif).toBeUndefined()
    expect(meta.xmp).toBeUndefined()
    expect(meta.icc).toBeUndefined()
  })
})
