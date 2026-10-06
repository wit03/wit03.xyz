// Small helpers shared by the Markdown renderer, the image tags and the feeds.

export function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** A line that opens or closes a fenced code block. */
export const FENCE = /^\s*(```|~~~)/

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'])
export const isImagePath = (p: string) => IMAGE_EXTENSIONS.has(p.slice(p.lastIndexOf('.')).toLowerCase())
