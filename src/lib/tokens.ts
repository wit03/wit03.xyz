// Canvas code can't use CSS variables directly, so read the colour tokens once.

export type Tokens = {
  accent: string
  muted: string
  line: string
  ink: string
  surface: string
  bg: string
  deep: string
}

let cache: Tokens | null = null

function read(): Tokens {
  const s = getComputedStyle(document.documentElement)
  const v = (n: string) => s.getPropertyValue(n).trim()
  return {
    accent: v('--accent'),
    muted: v('--muted'),
    line: v('--line'),
    ink: v('--ink'),
    surface: v('--surface'),
    bg: v('--bg'),
    deep: v('--deep'),
  }
}

export function tokens(): Tokens {
  return (cache ??= read())
}

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches
