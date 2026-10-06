'use client'

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '@/lib/tokens'

// The homepage's Projects preview: a horizontal, snap-scrolling row of cards with previous/next
// buttons. It never moves on its own. Cards are rendered on the server and passed in.

export default function ProjectCarousel({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const rail = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const measure = useCallback(() => {
    const el = rail.current
    if (!el) return
    setEdges({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
  }, [])

  useEffect(() => {
    const el = rail.current
    if (!el) return
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    addEventListener('resize', measure)
    return () => {
      el.removeEventListener('scroll', measure)
      removeEventListener('resize', measure)
    }
  }, [measure])

  const step = (dir: 1 | -1) => {
    const el = rail.current
    const card = el?.querySelector('li')
    if (!el || !card) return
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    el.scrollBy({
      left: dir * (card.getBoundingClientRect().width + gap),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }

  return (
    <div className='grid gap-5'>
      <ul ref={rail} className='project-rail' aria-label='Projects'>
        {children}
      </ul>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='flex gap-2'>
          <button
            type='button'
            className='rail-arrow'
            onClick={() => step(-1)}
            disabled={edges.start}
            aria-label='Previous projects'
          >
            ◀
          </button>
          <button
            type='button'
            className='rail-arrow'
            onClick={() => step(1)}
            disabled={edges.end}
            aria-label='Next projects'
          >
            ▶
          </button>
        </div>
        {footer}
      </div>
    </div>
  )
}
