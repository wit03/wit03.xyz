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
// Wave layers, back to front. amp: px either side of the rest line; lift: px the rest line
// sits above the horizon; k: wavelengths (px/rad); s: speeds (rad/ms); haze: mix toward the
// sky's horizon colour, so the far swell sits back.
const WAVES = [
  { amp: 5, lift: 24, k1: 150, k2: 57, s1: 1 / 1400, s2: 1 / 1000, haze: 0.42, crest: false },
  { amp: 9, lift: 12, k1: 95, k2: 39, s1: 1 / 800, s2: 1 / 600, haze: 0.2, crest: false },
  { amp: 14, lift: 0, k1: 60, k2: 24, s1: 1 / 480, s2: 1 / 340, haze: 0, crest: true },
]
const FOAM_DEPTH = 42 // px below the waterline that drifting foam reaches

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
  // Whole pixels, so the stepped bands meet without hairline seams on high-DPI screens.
  const horizon = Math.round(top + height)
  if (horizon + shallows < 0) return
  const strength = STRENGTH[sky.phase]
  const sea = OCEAN.sea[sky.phase]

  ctx.save()
  ctx.globalAlpha = strength
  for (let y = 0; y < height; y += STEP) {
    ctx.fillStyle = alongStops(sky.gradient, y / height)
    ctx.fillRect(0, top + y, width, STEP)
  }

  if (sky.stars) {
    ctx.fillStyle = OCEAN.star
    for (const s of STARS) {
      ctx.globalAlpha = strength * (0.5 + 0.4 * Math.sin(t / 700 + s.tw))
      ctx.fillRect(snap(s.x * width, CELL), snap(top + s.y * (height - 20), CELL), CELL - 1, CELL - 1)
    }
  }

  // On phones the hero text spans the whole width, so the sun and moon keep to the open strip
  // between it and the sea (still higher the higher they are) instead of sitting on the name.
  const rise = width < 640 ? height * 0.18 : height - 40
  const place = (b: { x: number; y: number }) => ({
    x: width * (0.08 + b.x * 0.84),
    y: horizon - 30 - b.y * rise,
  })

  const night = sky.phase === 'night'
  let sunX: number | null = null
  let moonX: number | null = null

  if (sky.sun.up && sky.phase !== 'night') {
    const p = place(sky.sun)
    sun(ctx, p.x, p.y, OCEAN.sun[sky.phase], t)
    sunX = p.x
  }

  if (sky.moon.up) {
    const p = place(sky.moon)
    const { fraction, litSide } = sky.moon
    // Terminator: a cell is lit when it lies past the ellipse k·√(1−v²) on the lit side.
    const k = 1 - 2 * fraction
    const dir = litSide === 'right' ? 1 : -1
    ctx.globalAlpha = night ? 0.95 : 0.55
    disc(ctx, p.x, p.y, 4, (u, w) =>
      u * dir > k * Math.sqrt(Math.max(0, 1 - w * w)) ? OCEAN.moon.lit : OCEAN.moon.dark,
    )
    if (night) moonX = p.x
  }

  // The sea: waves stand up in front of the sky (a low sun sets behind them), then the
  // shallows darken quickly and then slowly into the page's water. The last band is the page
  // colour itself, so the drawing ends without an edge.
  waves(ctx, width, horizon, sea, sky.gradient[sky.gradient.length - 1], night ? 0.5 : 0.95, t)
  ctx.globalAlpha = 1
  for (let y = CELL; y < shallows; y += STEP) {
    ctx.fillStyle = mixHex(sea, water, Math.pow(y / shallows, 0.6))
    ctx.fillRect(0, horizon + y, width, STEP)
  }
  if (sunX !== null) glitter(ctx, sunX, horizon, OCEAN.sun.core, 0.75, t)
  // Moonlight on the water, only at night and brighter the fuller the moon.
  if (moonX !== null) glitter(ctx, moonX, horizon, OCEAN.moon.lit, 0.2 + 0.35 * sky.moon.fraction, t)
  foam(ctx, width, horizon, night ? 0.35 : 0.6, t)
  ctx.restore()
}

/** Height (px) of a wave layer at x: two sines against each other, so no two crests match. */
function swell(x: number, t: number, w: (typeof WAVES)[number]) {
  return w.amp * (0.6 * Math.sin(x / w.k1 + t * w.s1) + 0.4 * Math.sin(x / w.k2 - t * w.s2))
}

/**
 * Two layers of swell above the horizon: a lighter, slower one behind and a choppier one in
 * front with a lit crest line and whitecaps where it peaks.
 */
function waves(
  ctx: CanvasRenderingContext2D,
  width: number,
  horizon: number,
  sea: string,
  skyLow: string,
  foamAlpha: number,
  t: number,
) {
  for (const w of WAVES) {
    const body = mixHex(sea, skyLow, w.haze)
    // Light catches the upper face of each wave; the trough behind it stays in shadow.
    const face = mixHex(body, OCEAN.waterline, 0.32)
    for (let x = 0; x < width; x += CELL) {
      const h = swell(x, t, w)
      const y = snap(horizon - w.lift - w.amp - h, CELL)
      ctx.globalAlpha = 1
      ctx.fillStyle = body
      ctx.fillRect(x, y, CELL, horizon + CELL - y)
      ctx.fillStyle = face
      ctx.fillRect(x, y, CELL, CELL * 2)
      if (!w.crest) continue
      // lit edge along the crest
      ctx.fillStyle = OCEAN.waterline
      ctx.globalAlpha = 0.7
      ctx.fillRect(x, y, CELL, CELL - 1)
      // whitecaps on the peaks, flickering as the crest breaks
      if (h > w.amp * 0.5 && hash(Math.floor(x / CELL) + Math.floor(t / 160) * 31) > 0.3) {
        ctx.fillStyle = OCEAN.foam
        ctx.globalAlpha = foamAlpha
        ctx.fillRect(x, y - CELL, CELL, CELL)
        if (h > w.amp * 0.7) ctx.fillRect(x, y, CELL, CELL * 2)
        // spray thrown off the highest peaks
        if (h > w.amp * 0.85 && hash(Math.floor(x / CELL) * 7 + Math.floor(t / 120)) > 0.6) {
          ctx.fillRect(x, y - CELL * 3, CELL - 1, CELL - 1)
        }
      }
    }
  }
}

/** Flecks of foam drifting just under the surface, fading with depth. */
function foam(ctx: CanvasRenderingContext2D, width: number, horizon: number, alpha: number, t: number) {
  ctx.fillStyle = OCEAN.foam
  const n = Math.round(width / 24)
  for (let i = 0; i < n; i++) {
    const depth = hash(i + 500) * FOAM_DEPTH
    const x = (((hash(i + 600) * width + t * 0.012 * (0.5 + hash(i + 700))) % width) + width) % width
    const y = horizon + CELL * 2 + depth + Math.sin(t / 900 + i) * 2
    ctx.globalAlpha = alpha * (1 - depth / FOAM_DEPTH) * (0.6 + 0.4 * Math.sin(t / 400 + i * 2.3))
    ctx.fillRect(snap(x, CELL), snap(y, CELL), CELL * (1 + (i % 3 === 0 ? 1 : 0)), CELL - 1)
  }
}
