import { Marked, type TokenizerAndRendererExtension } from 'marked'

// Renders the Markdown of a Published note to HTML, understanding the Obsidian-only syntax:
// - [[wikilinks]] become links only when they point at another Published note; anything else
//   (unpublished, private, missing) becomes plain text, so no private note name is ever a link.
// - > [!type] callouts become styled boxes.
// - #tags become chips.
// - ^block-references are stripped.

export type RenderContext = {
  /** The site path for a note name, if that note is published. */
  linkFor: (noteName: string) => string | undefined
}

const FENCE = /^\s*(```|~~~)/
const BLOCK_REF = /\s\^[A-Za-z0-9-]+\s*$/
const CALLOUT = /^>\s*\[!([A-Za-z-]+)\][+-]?\s*(.*)$/

export function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Line-level rewrites that must happen outside code fences: block references and callouts. */
function preprocess(source: string): string {
  const out: string[] = []
  const lines = source.split('\n')
  let fenced = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (FENCE.test(line)) fenced = !fenced
    if (fenced) {
      out.push(line)
      continue
    }
    const callout = line.match(CALLOUT)
    if (callout) {
      const [, type, title] = callout
      const inner: string[] = []
      while (i + 1 < lines.length && lines[i + 1].startsWith('>')) inner.push(lines[++i].replace(/^>\s?/, ''))
      const label = title.trim() || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
      out.push(
        `<aside class="callout" data-callout="${escapeHtml(type.toLowerCase())}">`,
        `<p class="callout-title">${escapeHtml(label)}</p>`,
        '',
        preprocess(inner.join('\n')),
        '',
        '</aside>',
        '',
      )
      continue
    }
    out.push(line.replace(BLOCK_REF, ''))
  }
  return out.join('\n')
}

function parseWikilink(inner: string) {
  const [target, alias] = inner.split('|')
  const noteName = target.split('#')[0].trim()
  return { noteName, text: (alias ?? noteName).trim() }
}

function extensions(ctx: RenderContext): TokenizerAndRendererExtension[] {
  return [
    {
      name: 'wikilink',
      level: 'inline',
      start: (src) => src.match(/!?\[\[/)?.index,
      tokenizer(src) {
        const m = src.match(/^(!?)\[\[([^\]\n]+?)\]\]/)
        if (!m) return undefined
        return { type: 'wikilink', raw: m[0], embed: m[1] === '!', ...parseWikilink(m[2]) }
      },
      renderer(token) {
        if (token.embed) return ''
        const href = ctx.linkFor(token.noteName)
        const text = escapeHtml(token.text)
        return href ? `<a href="${escapeHtml(href)}">${text}</a>` : text
      },
    },
    {
      name: 'tag',
      level: 'inline',
      // Only a # at the start of the text or after whitespace starts a tag (not "a#b" or "/#x").
      start(src) {
        for (let i = src.indexOf('#'); i !== -1; i = src.indexOf('#', i + 1)) {
          if ((i === 0 || /\s/.test(src[i - 1])) && /[A-Za-z]/.test(src[i + 1] ?? '')) return i
        }
        return undefined
      },
      tokenizer(src) {
        const m = src.match(/^#([A-Za-z][\w/-]*)/)
        if (!m) return undefined
        return { type: 'tag', raw: m[0], tag: m[1] }
      },
      renderer: (token) => `<span class="tag-chip">#${escapeHtml(token.tag)}</span>`,
    },
  ]
}

export function renderMarkdown(source: string, ctx: RenderContext) {
  const trimmed = source.trim()
  if (!trimmed) return ''
  const md = new Marked({ gfm: true, extensions: extensions(ctx) })
  return md.parse(preprocess(trimmed), { async: false }) as string
}
