'use client'

import { useEffect, useRef } from 'react'
import type { Section } from '@/lib/content'
import { MAX_DEPTH } from '@/lib/depth'
import { skyAt, type Sky } from '@/lib/sky'
import { prefersReducedMotion, tokens } from '@/lib/tokens'
import { createOcean } from '@/components/ocean/creatures'
import { drawSky } from '@/components/ocean/sky-scene'

// Scrolling is a dive. This draws the surface sky and parallax ocean behind the page, the pinned
// gauge with a tiny diver on the right, and the dive-computer readout. Depth is interpolated between the
// sections' configured depths, so the readout matches each section's label as it arrives.

const ARRIVE = 0.35 // a section "arrives" when its top reaches 35% down the viewport

const MINI_DIVER = ['..hhh..', '.hgggh.', '..srs..', 'ykkkkky', 'kakkkak', 'k.kkk.k', '..kkk..', '..k.k..', '..k.k..']
const FINS = [
  ['.ff.ff.', '.......'],
  ['..f.f..', '.ff.ff.'],
]
const SKY_GAP = 10 // px between the waterline and the top of the hero
const SKY_REFRESH_MS = 60_000
const LAYERS = [
  { f: 0.15, s: 2, a: 0.16, n: 22 },
  { f: 0.35, s: 2, a: 0.26, n: 18 },
  { f: 0.6, s: 3, a: 0.36, n: 12 },
]

export default function DiveLayer({ sections }: { sections: Section[] }) {
  const oceanRef = useRef<HTMLCanvasElement>(null)
  const gaugeRef = useRef<HTMLCanvasElement>(null)
  const depthRef = useRef<HTMLSpanElement>(null)
  const tempRef = useRef<HTMLSpanElement>(null)
  const secRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const oc = oceanRef.current
    const gc = gaugeRef.current
    const ox = oc?.getContext('2d')
    const gx = gc?.getContext('2d')
    if (!oc || !gc || !ox || !gx) return
    const reduce = prefersReducedMotion()
    const root = document.documentElement

    let dpr = 1
    let OW = 0,
      OH = 0,
      GW = 0,
      GH = 0
    let points: { id: string; y: number; depth: number; title: string }[] = []
    let depth = 0 // metres
    let lastTop = 0
    let kick = 0
    let lastKick = 0
    let lastExhale = 0
    let bubbles: { x: number; y: number; vy: number; a: number; ph: number }[] = []
    const ocean = createOcean()
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    let sky: Sky = skyAt(new Date(), timeZone)
    let pointer: { x: number; y: number } | null = null
    let skyHeight = 96 // waterline sits just above the hero; measured in measure()
    const parts = LAYERS.flatMap((L) =>
      Array.from({ length: L.n }, () => ({ L, x: Math.random(), y: Math.random() * 1000, ph: Math.random() * 6 })),
    )

    const maxScroll = () => Math.max(1, root.scrollHeight - innerHeight)

    function measure() {
      dpr = Math.min(2, devicePixelRatio || 1)
      OW = innerWidth
      OH = innerHeight
      oc!.width = OW * dpr
      oc!.height = OH * dpr
      GW = gc!.clientWidth
      GH = gc!.clientHeight
      gc!.width = GW * dpr
      gc!.height = GH * dpr
      const hero = document.getElementById('top')
      if (hero) skyHeight = Math.max(60, hero.getBoundingClientRect().top + scrollY - SKY_GAP)
      const max = maxScroll()
      let prev = 0
      points = sections.flatMap((s) => {
        const el = document.getElementById(s.id)
        if (!el) return []
        const y = Math.min(max, Math.max(prev, el.getBoundingClientRect().top + scrollY - innerHeight * ARRIVE))
        prev = y
        return [{ id: s.id, y, depth: s.depth, title: s.title }]
      })
      update()
    }

    function depthAt(y: number) {
      const pts = [{ y: 0, depth: 0 }, ...points, { y: maxScroll(), depth: MAX_DEPTH }]
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]
        const b = pts[i]
        if (y <= b.y) return b.y > a.y ? a.depth + ((y - a.y) / (b.y - a.y)) * (b.depth - a.depth) : b.depth
      }
      return MAX_DEPTH
    }

    function scrollForDepth(d: number) {
      const pts = [{ y: 0, depth: 0 }, ...points, { y: maxScroll(), depth: MAX_DEPTH }]
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]
        const b = pts[i]
        if (d <= b.depth) return b.depth > a.depth ? a.y + ((d - a.depth) / (b.depth - a.depth)) * (b.y - a.y) : b.y
      }
      return maxScroll()
    }

    function update() {
      depth = Math.min(MAX_DEPTH, Math.max(0, depthAt(scrollY)))
      const d = depth / MAX_DEPTH
      root.style.setProperty('--d', d.toFixed(3))
      let title = 'Surface'
      for (const p of points) if (scrollY >= p.y - 1) title = p.title
      if (depthRef.current) depthRef.current.firstChild!.textContent = depth.toFixed(1)
      if (tempRef.current) tempRef.current.textContent = `${(29.5 - d * 3).toFixed(1)}°C`
      if (secRef.current) secRef.current.textContent = title
      if (reduce) draw(0)
    }

    function drawOcean(t: number) {
      const T = tokens()
      const d = depth / MAX_DEPTH
      const top = scrollY
      ox!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ox!.clearRect(0, 0, OW, OH)
      drawSky(sky, { ctx: ox!, width: OW, top: -top, height: skyHeight, t, tokens: T })

      // light rays, fading out by ~12 m
      const rayA = Math.max(0, 1 - d * 2.4)
      if (rayA > 0) {
        ox!.fillStyle = T.surface
        for (let i = 0; i < 5; i++) {
          const x0 = (i * OW) / 4.2 + Math.sin(t / 3000 + i) * 30
          ox!.globalAlpha = rayA * (0.16 + 0.08 * Math.sin(t / 1400 + i * 1.7))
          ox!.beginPath()
          ox!.moveTo(x0, 0)
          ox!.lineTo(x0 + 46, 0)
          ox!.lineTo(x0 + 46 - OH * 0.35 + 160, OH)
          ox!.lineTo(x0 - OH * 0.35 + 160, OH)
          ox!.closePath()
          ox!.fill()
        }
        ox!.globalAlpha = 1
      }

      // marine snow in three parallax layers
      ox!.fillStyle = T.muted
      for (const p of parts) {
        const y = (((p.y - top * p.L.f - t * 0.006 * p.L.f) % OH) + OH) % OH
        const x = p.x * OW + Math.sin(t / 2200 + p.ph) * 6
        ox!.globalAlpha = p.L.a
        ox!.fillRect(Math.round(x / p.L.s) * p.L.s, Math.round(y / p.L.s) * p.L.s, p.L.s, p.L.s)
      }

      ox!.globalAlpha = 1

      ocean.draw({
        ctx: ox!,
        width: OW,
        height: OH,
        t,
        scrollY: top,
        scrollForDepth,
        sectionDepth: (id) => sections.find((s) => s.id === id)?.depth,
        floorY: OH + (maxScroll() - top),
        pointer,
        tokens: T,
        small: OW < 640,
      })
    }

    function drawGauge(t: number) {
      const T = tokens()
      gx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      gx!.clearRect(0, 0, GW, GH)
      const trackX = GW - 16
      const top = 34
      const bot = GH - 12
      const h = bot - top
      gx!.fillStyle = T.line
      gx!.fillRect(trackX - 1, top, 2, h)
      gx!.fillStyle = T.muted
      gx!.font = '9px ui-monospace, monospace'
      gx!.textAlign = 'right'
      gx!.fillText('0 m', GW - 4, 18)
      for (const s of sections) gx!.fillRect(trackX - 5, Math.round(top + (s.depth / MAX_DEPTH) * h), 10, 1)
      const dy = top + (depth / MAX_DEPTH) * h
      gx!.fillStyle = T.accent
      gx!.fillRect(trackX - 1, top, 2, dy - top)
      gx!.fillRect(trackX - 6, Math.round(dy) - 1, 12, 3)

      // the diver
      const S = GW < 70 ? 2 : 3
      const dw = 7 * S
      const x0 = Math.round(trackX - 10 - dw)
      const y0 = Math.round(dy - 5 * S)
      // a black wetsuit vanishes on the night-dive background, so lift it in dark mode
      const col: Record<string, string> = {
        h: T.dark ? '#3a3f4a' : '#1a1c22',
        g: '#8fd0f5',
        s: '#E9B790',
        r: '#2b2f36',
        k: T.dark ? '#4a5463' : '#1d2128',
        a: T.accent,
        y: '#E8B23A',
        f: T.accent,
      }
      MINI_DIVER.forEach((row, ry) => {
        for (let rx = 0; rx < 7; rx++) {
          const ch = row[rx]
          if (ch === '.') continue
          gx!.fillStyle = col[ch]
          gx!.fillRect(x0 + rx * S, y0 + ry * S, S, S)
        }
      })
      FINS[kick].forEach((row, ry) => {
        for (let rx = 0; rx < 7; rx++) {
          if (row[rx] !== 'f') continue
          gx!.fillStyle = col.f
          gx!.fillRect(x0 + rx * S, y0 + (9 + ry) * S, S, S)
        }
      })

      // exhale every few seconds
      if (!reduce && t - lastExhale > 2800) {
        lastExhale = t
        for (let i = 0; i < 4; i++) {
          bubbles.push({
            x: x0 + dw / 2 + (Math.random() * 6 - 3),
            y: y0 - 2 - i * 5,
            vy: 0.5 + Math.random() * 0.3,
            a: 0.9,
            ph: Math.random() * 6,
          })
        }
      }
      gx!.strokeStyle = T.accent
      gx!.lineWidth = 1
      for (const b of bubbles) {
        b.y -= b.vy
        b.vy = Math.min(1.6, b.vy + 0.01)
        b.x += Math.sin(t / 180 + b.ph) * 0.4
        b.a -= 0.006
        gx!.globalAlpha = Math.max(0, b.a) * 0.6
        gx!.strokeRect(Math.round(b.x) + 0.5, Math.round(b.y) + 0.5, S, S)
      }
      gx!.globalAlpha = 1
      bubbles = bubbles.filter((b) => b.a > 0 && b.y > -6)
    }

    function draw(t: number) {
      drawOcean(t)
      drawGauge(t)
    }

    let raf = 0
    function frame(t: number) {
      const vel = scrollY - lastTop
      lastTop = scrollY
      if (t - lastKick > (Math.abs(vel) > 0.5 ? 140 : 480)) {
        kick = 1 - kick
        lastKick = t
      }
      draw(t)
      raf = requestAnimationFrame(frame)
    }

    const onPointer = (e: PointerEvent) => {
      pointer = e.pointerType === 'mouse' ? { x: e.clientX, y: e.clientY } : null
    }
    const clearPointer = () => (pointer = null)
    const skyTimer = window.setInterval(() => {
      sky = skyAt(new Date(), timeZone)
      if (reduce) draw(0)
    }, SKY_REFRESH_MS)

    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    addEventListener('resize', measure)
    addEventListener('scroll', update, { passive: true })
    if (!reduce) {
      addEventListener('pointermove', onPointer, { passive: true })
      document.documentElement.addEventListener('pointerleave', clearPointer)
    }
    measure()
    if (!reduce) raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      removeEventListener('resize', measure)
      removeEventListener('scroll', update)
      removeEventListener('pointermove', onPointer)
      document.documentElement.removeEventListener('pointerleave', clearPointer)
      clearInterval(skyTimer)
    }
  }, [sections])

  return (
    <>
      <canvas ref={oceanRef} aria-hidden='true' className='pointer-events-none fixed inset-0 z-0 size-full' />
      <canvas
        ref={gaugeRef}
        aria-hidden='true'
        className='pointer-events-none fixed top-0 right-0 z-20 h-[calc(100dvh-92px)] w-20 max-sm:w-[58px]'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none fixed right-2.5 bottom-3 z-20 grid w-16 gap-px border border-line bg-surface px-1.5 pt-1.5 pb-1 font-mono text-[9.5px] text-muted tabular-nums max-sm:right-1.5 max-sm:w-[50px] max-sm:p-1'
      >
        <span ref={depthRef} className='font-pixel text-[15px] leading-tight text-ink max-sm:text-xs'>
          0.0<small className='text-[9px] text-muted'>m</small>
        </span>
        <span ref={tempRef}>29.5°C</span>
        <span ref={secRef} className='truncate font-pixel text-[8.5px] tracking-[0.04em] text-accent uppercase'>
          Surface
        </span>
      </div>
    </>
  )
}
