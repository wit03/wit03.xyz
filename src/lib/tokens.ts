// Canvas code can't use CSS variables directly, so read the theme tokens once
// and refresh them whenever the theme changes (OS setting or the toggle).

export type Tokens = { accent: string; muted: string; line: string; ink: string; surface: string; dark: boolean }

let cache: Tokens | null = null
let watching = false

function read(): Tokens {
  const s = getComputedStyle(document.documentElement)
  const v = (n: string) => s.getPropertyValue(n).trim()
  return {
    accent: v('--accent'),
    muted: v('--muted'),
    line: v('--line'),
    ink: v('--ink'),
    surface: v('--surface'),
    dark: s.colorScheme.includes('dark'),
  }
}

export function tokens(): Tokens {
  if (!watching) {
    watching = true
    const refresh = () => (cache = read())
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', refresh)
    new MutationObserver(refresh).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
  }
  return (cache ??= read())
}

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches
