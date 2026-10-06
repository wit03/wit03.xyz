import { Marked } from 'marked'

// Renders the Markdown of a Published note to HTML.

const md = new Marked({ gfm: true })

export function renderMarkdown(source: string) {
  const trimmed = source.trim()
  return trimmed ? (md.parse(trimmed, { async: false }) as string) : ''
}
