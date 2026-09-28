'use client'

import { useEffect, useRef } from 'react'
import type { Section } from '@/lib/content'
import { MAX_DEPTH } from '@/lib/depth'
import { OCEAN } from '@/lib/palette'
import { skyAt, type Sky } from '@/lib/sky'
import { prefersReducedMotion, tokens } from '@/lib/tokens'
import { createOcean } from '@/components/ocean/creatures'
import { mixHex, type Point } from '@/components/ocean/pixels'
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
    let sky: Sky
    let pointer: Point | null = null
    let skyHeight = 800 // waterline sits along the bottom of the first screen; measured in measure()
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
      const surface = document.getElementById('top')
      if (surface) skyHeight = Math.max(60, surface.getBoundingClientRect().bottom + scrollY)
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
      if (depthRef.current)
        depthRef.current.firstChild!.textContent = innerWidth < 640 ? String(Math.round(depth)) : depth.toFixed(1)
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
      // The sky fills the first screen and scrolls away with it.
      drawSky(sky, {
        ctx: ox!,
        width: OW,
        top: -top,
        height: skyHeight,
        t,
        // Mirrors --water in globals.css (bg mixed toward deep by up to 16%).
        water: mixHex(T.bg, T.deep, d * 0.16),
        shallows: OH,
      })

      // Everything else lives underwater, below the waterline.
      const surfaceY = Math.max(0, skyHeight - top)
      if (surfaceY >= OH) return
      ox!.save()
      ox!.beginPath()
      ox!.rect(0, surfaceY, OW, OH - surfaceY)
      ox!.clip()

      // light rays from the waterline, fading out by ~12 m
      const rayA = Math.max(0, 1 - d * 2.4)
      if (rayA > 0) {
        ox!.fillStyle = OCEAN.waterline
        for (let i = 0; i < 5; i++) {
          const x0 = (i * OW) / 4.2 + Math.sin(t / 3000 + i) * 30
          ox!.globalAlpha = rayA * (0.06 + 0.03 * Math.sin(t / 1400 + i * 1.7))
          ox!.beginPath()
          ox!.moveTo(x0, surfaceY)
          ox!.lineTo(x0 + 46, surfaceY)
          ox!.lineTo(x0 + 46 - OH * 0.35 + 160, surfaceY + OH)
          ox!.lineTo(x0 - OH * 0.35 + 160, surfaceY + OH)
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
      ox!.restore()
    }

    function drawGauge(t: number) {
      const T = tokens()
      gx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      gx!.clearRect(0, 0, GW, GH)
      // Phones get a slim gauge: the track hugs the edge and the diver rides on it.
      const slim = GW < 50
      const trackX = slim ? GW - 8 : GW - 16
      const top = 34
      const bot = GH - 12
      const h = bot - top
      gx!.fillStyle = T.line
      gx!.fillRect(trackX - 1, top, 2, h)
      gx!.fillStyle = T.muted
      gx!.font = '9px ui-monospace, monospace'
      gx!.textAlign = 'right'
      gx!.fillText(slim ? '0' : '0 m', GW - 4, 18)
      const tick = slim ? 3 : 5
      for (const s of sections) gx!.fillRect(trackX - tick, Math.round(top + (s.depth / MAX_DEPTH) * h), tick * 2, 1)
      const dy = top + (depth / MAX_DEPTH) * h
      gx!.fillStyle = T.accent
      gx!.fillRect(trackX - 1, top, 2, dy - top)
      gx!.fillRect(trackX - 6, Math.round(dy) - 1, 12, 3)

      // the diver
      const S = GW < 70 ? 2 : 3
      const dw = 7 * S
      const x0 = Math.round(slim ? trackX - dw / 2 : trackX - 10 - dw)
      const y0 = Math.round(dy - 5 * S)
      // hair and wetsuit are lifted from black so they show on the dark water
      const col: Record<string, string> = {
        h: '#3a3f4a',
        g: '#8fd0f5',
        s: '#E9B790',
        r: '#2b2f36',
        k: '#4a5463',
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
    // The hero reads this to pick dark or light text for the sky behind it.
    const setSky = () => {
      sky = skyAt(new Date(), timeZone)
      root.dataset.sky = sky.phase
    }
    setSky()
    const skyTimer = window.setInterval(() => {
      setSky()
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
        className='pointer-events-none fixed top-0 right-0 z-20 h-[calc(100dvh-92px)] w-20 max-sm:h-[calc(100dvh-48px)] max-sm:w-[34px]'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none fixed right-2.5 bottom-3 z-20 grid w-16 gap-px border border-line bg-surface px-1.5 pt-1.5 pb-1 font-mono text-[9.5px] text-muted tabular-nums max-sm:right-1 max-sm:bottom-2 max-sm:w-[32px] max-sm:px-0.5 max-sm:py-1 max-sm:text-center'
      >
        <span ref={depthRef} className='font-pixel text-[15px] leading-tight text-ink max-sm:text-[11px]'>
          0.0<small className='text-[9px] text-muted'>m</small>
        </span>
        <span ref={tempRef} className='max-sm:hidden'>
          29.5°C
        </span>
        <span
          ref={secRef}
          className='truncate font-pixel text-[8.5px] tracking-[0.04em] text-accent uppercase max-sm:hidden'
        >
          Surface
        </span>
      </div>
    </>
  )
}
