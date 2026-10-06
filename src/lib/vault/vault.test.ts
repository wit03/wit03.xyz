import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { readVault } from '@/lib/vault'

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
