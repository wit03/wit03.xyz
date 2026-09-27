'use client'

import { useEffect, useRef } from 'react'
import Avatar from '@/components/Avatar'
import { prefersReducedMotion, tokens } from '@/lib/tokens'

type Props = {
  handle: string
  name: string
  tagline: string
  status?: string
  links: { label: string; href: string }[]
}

const COLS = 14
const ROWS = 4

export default function Hero({ handle, name, tagline, status, links }: Props) {
  const heroRef = useRef<HTMLElement>(null)
  const dissolveRef = useRef<HTMLSpanElement>(null)
  const trailRef = useRef<HTMLCanvasElement>(null)

  // Intro: the handle resolves out of pixel blocks, once per session.
  useEffect(() => {
    const cells = Array.from(dissolveRef.current?.children ?? []) as HTMLElement[]
    if (prefersReducedMotion()) return
    try {
      if (sessionStorage.getItem('intro')) return
      sessionStorage.setItem('intro', '1')
    } catch {}
    for (const c of cells) {
      c.style.transition = 'none'
      c.style.opacity = '1'
    }
    void dissolveRef.current?.offsetWidth
    cells.forEach((c, i) => {
      c.style.transition = `opacity 0s linear ${250 + (i % COLS) * 36 + Math.random() * 380}ms`
      c.style.opacity = '0'
    })
  }, [])

  // The hero sinks and fades slower than the page scrolls.
  useEffect(() => {
    const el = heroRef.current
    if (!el || prefersReducedMotion()) return
    const onScroll = () => {
      const y = Math.min(scrollY, 440)
      el.style.transform = `translateY(${(y * 0.28).toFixed(1)}px)`
      el.style.opacity = Math.max(0, 1 - y / 420).toFixed(2)
    }
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])

  // Cursor trail: fading squares snapped to an 8px grid. Desktop only.
  useEffect(() => {
    const hero = heroRef.current
    const cv = trailRef.current
    const ctx = cv?.getContext('2d')
    if (!hero || !cv || !ctx || prefersReducedMotion() || !matchMedia('(pointer: fine)').matches) return
    let squares: { x: number; y: number; a: number }[] = []
    let raf = 0
    const size = () => {
      cv.width = cv.clientWidth
      cv.height = cv.clientHeight
    }
    const draw = () => {
      ctx.clearRect(0, 0, cv.width, cv.height)
      ctx.fillStyle = tokens().accent
      for (const s of squares) {
        ctx.globalAlpha = Math.max(0, s.a)
        ctx.fillRect(s.x, s.y, 8, 8)
        s.a -= 0.03
      }
      ctx.globalAlpha = 1
      squares = squares.filter((s) => s.a > 0)
      raf = squares.length ? requestAnimationFrame(draw) : 0
    }
    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      const x = Math.floor((e.clientX - r.left) / 8) * 8
      const y = Math.floor((e.clientY - r.top) / 8) * 8
      const last = squares[squares.length - 1]
      if (!last || last.x !== x || last.y !== y) squares.push({ x, y, a: 0.45 })
      if (!raf) raf = requestAnimationFrame(draw)
    }
    size()
    addEventListener('resize', size)
    hero.addEventListener('pointermove', onMove)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('resize', size)
      hero.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <section
      ref={heroRef}
      id='top'
      className='relative mt-12 grid grid-cols-[auto_1fr] items-center gap-7 will-change-transform max-sm:grid-cols-1 max-sm:gap-4'
    >
      <canvas
        ref={trailRef}
        aria-hidden='true'
        className='pointer-events-none absolute -inset-5 size-[calc(100%+40px)]'
      />
      <Avatar label={`Pixel-art avatar of ${handle} with round glasses`} />
      <div className='relative grid gap-3'>
        <h1 className='grid gap-1'>
          <span className='relative inline-block justify-self-start text-[clamp(48px,9vw,76px)] leading-none font-semibold tracking-[-0.045em]'>
            {handle}
            <span
              ref={dissolveRef}
              aria-hidden='true'
              className='dissolve'
              style={{ gridTemplateColumns: `repeat(${COLS},1fr)`, gridTemplateRows: `repeat(${ROWS},1fr)` }}
            >
              {Array.from({ length: COLS * ROWS }, (_, i) => (
                <i key={i} />
              ))}
            </span>
          </span>
          <span className='text-lg font-medium tracking-[-0.01em] text-muted'>{name}</span>
        </h1>
        <p className='max-w-[44ch] text-muted'>{tagline}</p>
        {status && (
          <span className='inline-flex items-center gap-2 font-mono text-xs'>
            <i className='pulse block size-2 bg-ok' />
            {status}
          </span>
        )}
        <div className='flex flex-wrap gap-2'>
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className='step-ease border border-line px-2.5 py-0.5 font-mono text-xs transition-colors duration-150 hover:border-ink hover:bg-ink hover:text-bg'
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
