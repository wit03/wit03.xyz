'use client'

import { useEffect, useRef, useState } from 'react'
import { COLORS, EYES, GEAR, GLASSES, GLINT, SPRITE } from '@/lib/sprite'
import { prefersReducedMotion, tokens } from '@/lib/tokens'

// A 24×24 scene with the 16px-wide sprite in the middle. Idle: blink, breathe, look at the
// cursor, glint across the glasses. Click: water rises, dive gear goes on, bubbles on exhale.

const N = 24
const OX = 4
const OY = 4
const FRAME_MS = 80
const BREATH_MS = 3200
const WATER_TOP = [95, 176, 230]
const WATER_BOT = [20, 84, 143]

type Bubble = { x: number; y: number; vy: number; age: number; seed: number; big: boolean; dead?: boolean }

export default function Avatar({ label }: { label: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const diveRef = useRef(false)
  const [diving, setDiving] = useState(false)

  const toggle = () => {
    diveRef.current = !diveRef.current
    setDiving(diveRef.current)
  }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const reduce = prefersReducedMotion()
    const now = performance.now()
    const s = {
      look: 1,
      lookY: 0,
      blinkUntil: 0,
      nextBlink: now + 2200,
      glint: -1,
      nextGlint: now + 3500,
      wl: N + 1, // water level (row); N+1 means dry
      bob: 0,
      lastBob: 0,
      diveStart: 0,
      wasDiving: false,
      bubbles: [] as Bubble[],
      pops: [] as { x: number; y: number }[],
      snow: Array.from({ length: 6 }, () => ({ x: Math.random() * N, y: Math.random() * N, p: Math.random() * 6 })),
    }

    const px = (x: number, y: number, c: string) => {
      if (x < 0 || y < 0 || x >= N || y >= N) return
      ctx.fillStyle = c
      ctx.fillRect(x, y, 1, 1)
    }
    const lerp = (a: number, b: number, k: number) => Math.round(a + (b - a) * k)

    function draw(t: number) {
      const accent = tokens().accent
      const { wl } = s
      const gear = diveRef.current || wl < N + 1
      const by = OY + s.bob
      const sp = (x: number, y: number, c: string) => px(OX + x, by + y, c)
      ctx!.clearRect(0, 0, N, N)

      // water with slanted light rays
      if (wl < N) {
        for (let y = Math.max(0, Math.ceil(wl)); y < N; y++) {
          const k = y / N
          ctx!.fillStyle = `rgb(${lerp(WATER_TOP[0], WATER_BOT[0], k)},${lerp(WATER_TOP[1], WATER_BOT[1], k)},${lerp(WATER_TOP[2], WATER_BOT[2], k)})`
          ctx!.fillRect(0, y, N, 1)
          for (let x = 0; x < N; x++) {
            const r = (((x + y * 0.55 + t * 0.0022) % 8) + 8) % 8
            if (r < 1.6) px(x, y, `rgba(255,255,255,${0.13 * (1 - k)})`)
          }
        }
      }

      // body; the shirt becomes a wetsuit with accent BCD straps
      SPRITE.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const ch = row[x]
          if (ch !== '.') sp(x, y, ch === 't' ? (gear ? GEAR.suit : accent) : COLORS[ch])
        }
      })
      if (gear) {
        for (let y = 16; y < SPRITE.length; y++) {
          sp(4, y, accent)
          sp(11, y, accent)
        }
      }

      // hair drifts once the head is under
      if (gear && wl < by + 3) {
        const ph = Math.floor(t / 420)
        for (let x = 4; x < 12; x++) if ((x + ph) % 3 === 0) sp(x, 0, COLORS.h)
        if (ph % 2) {
          sp(1, 3, COLORS.h)
          sp(14, 3, COLORS.h)
        }
      }

      // eyes
      const blinking = t < s.blinkUntil
      for (const [a, b] of EYES) {
        if (blinking) {
          for (const c of [a, b]) {
            sp(c, 7, COLORS.s)
            sp(c, 8, COLORS.h)
          }
        } else {
          const pc = s.look < 0 ? a : b
          sp(pc, 7, COLORS.h)
          sp(pc, 8, COLORS.h)
          if (s.lookY < 0) sp(pc, 8, COLORS.w)
          else if (s.lookY > 0) sp(pc, 7, COLORS.w)
        }
      }

      if (!gear) {
        for (const [x, y] of GLASSES) sp(x, y, GEAR.frame)
        if (s.glint >= 0 && s.glint < GLINT.length) for (const [x, y] of GLINT[s.glint]) sp(x, y, GEAR.glint)
      } else {
        // mask: frame, strap, nose pocket, tinted glass
        for (let x = 3; x <= 12; x++) sp(x, 6, COLORS.h)
        for (const x of [2, 3, 4, 5, 6, 9, 10, 11, 12, 13]) sp(x, 9, COLORS.h)
        for (const y of [7, 8]) for (const x of [1, 2, 7, 8, 13, 14]) sp(x, y, COLORS.h)
        for (const y of [9, 10]) {
          sp(7, y, '#30343c')
          sp(8, y, '#30343c')
        }
        ctx!.fillStyle = 'rgba(150,215,255,.38)'
        ctx!.fillRect(OX + 3, by + 7, 4, 2)
        ctx!.fillRect(OX + 9, by + 7, 4, 2)
        sp(3, 7, 'rgba(255,255,255,.8)')
        sp(9, 7, 'rgba(255,255,255,.8)')
        // regulator and hose
        for (let x = 6; x <= 9; x++) {
          sp(x, 12, GEAR.reg)
          sp(x, 13, GEAR.reg2)
        }
        sp(5, 12, GEAR.reg2)
        sp(10, 12, GEAR.reg2)
        sp(7, 13, accent)
        sp(8, 13, accent)
        for (const [x, y] of [
          [10, 13],
          [11, 14],
          [12, 15],
          [12, 16],
          [13, 17],
          [13, 18],
        ])
          sp(x, y, GEAR.hose)
      }

      if (wl < N) {
        // water absorbs the reds
        const top = Math.max(0, Math.ceil(wl))
        ctx!.fillStyle = 'rgba(10,62,140,.18)'
        ctx!.fillRect(0, top, N, N - top)
        for (const p of s.snow) if (p.y > wl + 1) px(Math.floor(p.x), Math.floor(p.y), 'rgba(255,255,255,.45)')
        for (const b of s.bubbles) {
          const x = Math.floor(b.x)
          const y = Math.floor(b.y)
          if (b.big) {
            ctx!.fillStyle = 'rgba(200,236,255,.55)'
            ctx!.fillRect(x, y, 2, 2)
            px(x, y, 'rgba(255,255,255,.95)')
          } else px(x, y, 'rgba(215,242,255,.85)')
        }
        for (let x = 0; x < N; x++) {
          const y = Math.round(wl + Math.sin(t / 260 + x * 0.7) * 0.7)
          px(x, y, 'rgba(225,246,255,.95)')
          px(x, y + 1, 'rgba(170,220,248,.55)')
        }
        for (const p of s.pops) {
          px(p.x - 1, p.y, 'rgba(255,255,255,.9)')
          px(p.x + 1, p.y, 'rgba(255,255,255,.9)')
          px(p.x, p.y - 1, 'rgba(255,255,255,.7)')
        }
      }
    }

    function tick(t: number) {
      const diving = diveRef.current
      if (diving !== s.wasDiving) {
        s.wasDiving = diving
        s.diveStart = t
        s.bubbles = []
        if (reduce) s.wl = diving ? -2 : N + 1
      }
      if (t > s.nextBlink) {
        s.blinkUntil = t + 140
        s.nextBlink = t + 2200 + Math.random() * 3000
      }
      if (s.glint >= 0) {
        s.glint++
        if (s.glint > GLINT.length) {
          s.glint = -1
          s.nextGlint = t + 4500 + Math.random() * 3000
        }
      } else if (t > s.nextGlint && !reduce) s.glint = 0

      if (!reduce) {
        if (diving && s.wl > -2) s.wl = Math.max(-2, s.wl - 1)
        if (!diving && s.wl < N + 1) s.wl = Math.min(N + 1, s.wl + 1)
      }

      // underwater, the breath cycle drives buoyancy (inhale lifts) and bubbles (exhale)
      if (diving && s.wl < OY + s.bob + 12 && !reduce) {
        const ph = ((t - s.diveStart) % BREATH_MS) / BREATH_MS
        s.bob = Math.round(-Math.sin(ph * Math.PI * 2) * 0.8)
        if (ph > 0.56 && Math.random() < 0.5) {
          const side = Math.random() < 0.5 ? 5 : 10
          s.bubbles.push({
            x: OX + side + (side === 5 ? -0.4 : 0.4),
            y: OY + s.bob + 12,
            vy: 0.3,
            age: 0,
            seed: Math.random() * 6,
            big: false,
          })
        }
      } else if (!reduce && t - s.lastBob > 700) {
        s.bob = s.bob > 0 ? 0 : 1
        s.lastBob = t
      }

      s.pops = []
      for (const b of s.bubbles) {
        b.age++
        b.vy = Math.min(1.1, b.vy + 0.07)
        b.y -= b.vy
        b.x += Math.sin(b.age * 0.9 + b.seed) * 0.4
        if (b.age > 5) b.big = true
        if (b.y <= s.wl + 0.5) {
          b.dead = true
          s.pops.push({ x: Math.round(b.x), y: Math.round(s.wl) })
        }
      }
      s.bubbles = s.bubbles.filter((b) => !b.dead && b.y > -2)
      for (const p of s.snow) {
        p.y += 0.06
        p.x += Math.sin(t / 900 + p.p) * 0.05
        if (p.y > N) {
          p.y = Math.max(0, s.wl)
          p.x = Math.random() * N
        }
      }
      draw(t)
    }

    let timer = 0
    let raf = 0
    const loop = () => {
      tick(performance.now())
      timer = window.setTimeout(() => (raf = requestAnimationFrame(loop)), FRAME_MS)
    }
    loop()

    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height * 0.4)
      s.look = dx < -8 ? -1 : 1
      s.lookY = Math.abs(dy) < 50 ? 0 : dy < 0 ? -1 : 1
    }
    window.addEventListener('pointermove', onMove)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <div className='relative grid justify-items-center gap-1.5 max-sm:justify-items-start'>
      <canvas
        ref={ref}
        width={N}
        height={N}
        role='button'
        tabIndex={0}
        aria-pressed={diving}
        aria-label={`${label}. ${diving ? 'Surface' : 'Go diving'}.`}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggle()
          }
        }}
        className='block size-44 cursor-pointer [image-rendering:pixelated] max-sm:size-36'
      />
      <span className='font-pixel text-[9px] tracking-[0.06em] text-muted'>
        {diving ? 'click to surface' : 'click to dive'}
      </span>
    </div>
  )
}
