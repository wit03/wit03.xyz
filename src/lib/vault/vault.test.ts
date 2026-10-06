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
