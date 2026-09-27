'use client'

import { useSyncExternalStore } from 'react'

// Follows the OS until clicked; the choice is stored and applied before paint by the
// inline script in the root layout.

type Theme = 'light' | 'dark'

const listeners = new Set<() => void>()

function current(): Theme {
  const set = document.documentElement.dataset.theme
  if (set === 'light' || set === 'dark') return set
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const mq = matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', cb)
  return () => {
    listeners.delete(cb)
    mq.removeEventListener('change', cb)
  }
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore<Theme | null>(subscribe, current, () => null)

  const flip = () => {
    const next: Theme = current() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {}
    listeners.forEach((l) => l())
  }

  return (
    <button
      type='button'
      onClick={flip}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className='step-ease grid size-7 cursor-pointer place-items-center border border-line text-muted transition-colors duration-150 hover:border-muted hover:text-ink'
    >
      {/* pixel sun / moon */}
      <svg width='14' height='14' viewBox='0 0 7 7' shapeRendering='crispEdges' fill='currentColor' aria-hidden='true'>
        {theme === 'dark' ? (
          <path d='M2 0h3v1H2zM1 1h2v1H1zM0 2h2v3H0zM1 5h2v1H1zM2 6h3v1H2z' />
        ) : (
          <path d='M3 0h1v1H3zM3 6h1v1H3zM0 3h1v1H0zM6 3h1v1H6zM1 1h1v1H1zM5 1h1v1H5zM1 5h1v1H1zM5 5h1v1H5zM2 2h3v3H2z' />
        )}
      </svg>
    </button>
  )
}
