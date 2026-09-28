import { OCEAN } from '@/lib/palette'
import type { Sky } from '@/lib/sky'
import { alongStops, hash, mixHex, snap } from './pixels'

// Draws the surface: a stepped sky gradient above a wavy waterline, stars at night, and the
// sun and moon where the visitor would see them. The band fills most of the first screen and
// scrolls away as the dive begins. Below the waterline, sunlit shallows darken step by step
// into the page's own water colour, so there is no seam where the drawing ends. Positions and
// phases come from the pure sky module.

const CELL = 3 // pixel size for the sun, moon and stars
const STEP = 6 // height of each gradient band, for the pixel look
const STARS = Array.from({ length: 72 }, (_, i) => ({ x: hash(i + 101), y: hash(i + 201), tw: i * 0.7 }))
// How strongly each sky paints over the dark page. Bright skies paint fully; the hero switches
// to dark text over them (see data-sky in globals.css).
const STRENGTH: Record<Sky['phase'], number> = { night: 0.85, dawn: 0.75, dusk: 0.75, golden: 1, day: 1 }
// Sun halo rings: inner radius, outer radius (in cells), alpha.
const HALO: [number, number, number][] = [
  [5, 9, 0.28],
  [9, 13, 0.12],
]
const GLITTER_ROWS = 14

export type SkyView = {
  ctx: CanvasRenderingContext2D
  width: number
  /** Screen y of the band's top edge (0 at the top of the page, negative once scrolled). */
  top: number
  height: number
  t: number
  /** The page's current water colour (#rrggbb), which the shallows darken into. */
  water: string
  /** How far below the waterline (px) the shallows reach before they match the page. */
  shallows: number
}

/** Fills a pixel disc; `paint(u, v)` picks each cell's colour, with u and v in -1..1 across the disc. */
function disc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  paint: (u: number, v: number) => string,
) {
  for (let gy = -r; gy <= r; gy++) {
    for (let gx = -r; gx <= r; gx++) {
      if (gx * gx + gy * gy > r * r) continue
      ctx.fillStyle = paint(gx / r, gy / r)
      ctx.fillRect(snap(cx, CELL) + gx * CELL, snap(cy, CELL) + gy * CELL, CELL, CELL)
    }
  }
}

/**
 * The sun: a dithered halo in two rings, eight pixel rays turning slowly with alternating
 * lengths that breathe, and the disc on top.
 */
function sun(ctx: CanvasRenderingContext2D, x: number, y: number, rim: string, t: number) {
  const cx = snap(x, CELL)
  const cy = snap(y, CELL)
  ctx.fillStyle = rim
  for (const [r0, r1, a] of HALO) {
    ctx.globalAlpha = a
    for (let gy = -r1; gy <= r1; gy++) {
      for (let gx = -r1; gx <= r1; gx++) {
        const d2 = gx * gx + gy * gy
        // Checkerboard dither keeps the glow pixelated instead of a smooth blur.
        if (d2 <= r0 * r0 || d2 > r1 * r1 || (gx + gy) & 1) continue
        ctx.fillRect(cx + gx * CELL, cy + gy * CELL, CELL, CELL)
      }
    }
  }
  ctx.globalAlpha = 0.85
  for (let i = 0; i < 8; i++) {
    const a = t / 9000 + (i * Math.PI) / 4
    const len = (i % 2 ? 2 : 3) + (Math.sin(t / 900 + i) > 0.3 ? 1 : 0)
    for (let r = 7; r < 7 + len; r++) {
      ctx.fillRect(cx + Math.round(Math.cos(a) * r) * CELL, cy + Math.round(Math.sin(a) * r) * CELL, CELL, CELL)
    }
  }
  ctx.globalAlpha = 1
  disc(ctx, x, y, 5, (u, w) => (u * u + w * w > 0.6 ? rim : OCEAN.sun.core))
}

/**
 * A path of light on the water below a sun or moon: twinkling dashes that fan out and fade
 * with distance from the waterline.
 */
function glitter(ctx: CanvasRenderingContext2D, x: number, horizon: number, color: string, alpha: number, t: number) {
  ctx.fillStyle = color
  for (let row = 0; row < GLITTER_ROWS; row++) {
    const spread = 12 + row * 8
    const fade = 1 - row / GLITTER_ROWS
    for (let j = 0; j < 3; j++) {
      const seed = row * 7 + j
      if (Math.sin(t / 280 + seed * 1.7) < 0.1) continue
      const dx = (hash(seed + 300) - 0.5) * 2 * spread
      const w = CELL * (2 + Math.floor(hash(seed + 400) * 3 * fade + 1))
      ctx.globalAlpha = alpha * fade
      ctx.fillRect(snap(x + dx - w / 2, CELL), snap(horizon + 6 + row * STEP, CELL), w, CELL - 1)
    }
  }
}

export function drawSky(sky: Sky, v: SkyView) {
  const { ctx, width, top, height, t, water, shallows } = v
  const horizon = top + height
  if (horizon + shallows < 0) return
  const strength = STRENGTH[sky.phase]
  const sea = OCEAN.sea[sky.phase]

  ctx.save()
  ctx.globalAlpha = strength
  for (let y = 0; y < height; y += STEP) {
    ctx.fillStyle = alongStops(sky.gradient, y / height)
    ctx.fillRect(0, top + y, width, STEP)
  }
  // Shallows: sunlit sea at the waterline, darkening quickly and then slowly into the page's
  // water. The last band is the page colour itself, so the drawing ends without an edge.
  ctx.globalAlpha = 1
  for (let y = 0; y < shallows; y += STEP) {
    ctx.fillStyle = mixHex(sea, water, Math.pow(y / shallows, 0.6))
    ctx.fillRect(0, horizon + y, width, STEP)
  }

  if (sky.stars) {
    ctx.fillStyle = OCEAN.star
    for (const s of STARS) {
      ctx.globalAlpha = strength * (0.5 + 0.4 * Math.sin(t / 700 + s.tw))
      ctx.fillRect(snap(s.x * width, CELL), snap(top + s.y * (height - 20), CELL), CELL - 1, CELL - 1)
    }
  }

  const place = (b: { x: number; y: number }) => ({
    x: width * (0.08 + b.x * 0.84),
    y: horizon - 18 - b.y * (height - 40),
  })

  if (sky.sun.up && sky.phase !== 'night') {
    const p = place(sky.sun)
    const rim = OCEAN.sun[sky.phase]
    sun(ctx, p.x, p.y, rim, t)
    glitter(ctx, p.x, horizon, OCEAN.sun.core, 0.75, t)
  }

  if (sky.moon.up) {
    const p = place(sky.moon)
    const { fraction, litSide } = sky.moon
    // Terminator: a cell is lit when it lies past the ellipse k·√(1−v²) on the lit side.
    const k = 1 - 2 * fraction
    const dir = litSide === 'right' ? 1 : -1
    const night = sky.phase === 'night'
    ctx.globalAlpha = night ? 0.95 : 0.55
    disc(ctx, p.x, p.y, 4, (u, w) =>
      u * dir > k * Math.sqrt(Math.max(0, 1 - w * w)) ? OCEAN.moon.lit : OCEAN.moon.dark,
    )
    // Moonlight on the water, only at night and brighter the fuller the moon.
    if (night) glitter(ctx, p.x, horizon, OCEAN.moon.lit, 0.2 + 0.35 * fraction, t)
  }

  ctx.globalAlpha = 0.6
  ctx.fillStyle = OCEAN.waterline
  for (let x = 0; x < width; x += CELL) {
    const y = horizon + Math.round(Math.sin(t / 500 + x / 40) * 1.5)
    ctx.fillRect(x, snap(y, CELL), CELL, CELL - 1)
  }
  ctx.restore()
}
