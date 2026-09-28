import { OCEAN } from '@/lib/palette'
import type { Sky } from '@/lib/sky'
import { alongStops, hash, mixHex, snap } from './pixels'

// Draws the surface: a stepped sky gradient above a wavy waterline, stars at night, and the
// sun and moon where the visitor would see them. The band fills the page's first screen,
// scrolls away as the dive begins, and blends into the water below. Positions and phases
// come from the pure sky module.

const CELL = 3 // pixel size for the sun, moon and stars
const STEP = 6 // height of each gradient band, for the pixel look
const BLEND = 48 // px below the waterline where the sky colour blends into the water
const STARS = Array.from({ length: 72 }, (_, i) => ({ x: hash(i + 101), y: hash(i + 201), tw: i * 0.7 }))
// How strongly each sky paints over the dark page. The hero sits on the sky, so bright skies
// are toned right down to keep its text readable.
const STRENGTH: Record<Sky['phase'], number> = { night: 0.85, dawn: 0.55, dusk: 0.55, golden: 0.35, day: 0.3 }

export type SkyView = {
  ctx: CanvasRenderingContext2D
  width: number
  /** Screen y of the band's top edge (0 at the top of the page, negative once scrolled). */
  top: number
  height: number
  t: number
  /** The page's current water colour (#rrggbb), which the horizon blends into. */
  water: string
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

export function drawSky(sky: Sky, v: SkyView) {
  const { ctx, width, top, height, t, water } = v
  if (top + height + BLEND < 0) return
  const horizon = top + height
  const strength = STRENGTH[sky.phase]
  const horizonColor = sky.gradient[sky.gradient.length - 1]

  ctx.save()
  ctx.globalAlpha = strength
  for (let y = 0; y < height; y += STEP) {
    ctx.fillStyle = alongStops(sky.gradient, y / height)
    ctx.fillRect(0, top + y, width, STEP)
  }
  // The gradient's last stop is the water itself, so the sky melts into the sea.
  for (let y = 0; y < BLEND; y += STEP) {
    const k = y / BLEND
    ctx.globalAlpha = strength * (1 - k)
    ctx.fillStyle = mixHex(horizonColor, water, k)
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
    ctx.globalAlpha = 0.95
    disc(ctx, p.x, p.y, 4, (u, w) => (u * u + w * w > 0.7 ? rim : OCEAN.sun.core))
  }

  if (sky.moon.up) {
    const p = place(sky.moon)
    const { fraction, litSide } = sky.moon
    // Terminator: a cell is lit when it lies past the ellipse k·√(1−v²) on the lit side.
    const k = 1 - 2 * fraction
    const dir = litSide === 'right' ? 1 : -1
    ctx.globalAlpha = sky.phase === 'night' ? 0.95 : 0.55
    disc(ctx, p.x, p.y, 4, (u, w) =>
      u * dir > k * Math.sqrt(Math.max(0, 1 - w * w)) ? OCEAN.moon.lit : OCEAN.moon.dark,
    )
  }

  ctx.globalAlpha = 0.6
  ctx.fillStyle = OCEAN.waterline
  for (let x = 0; x < width; x += CELL) {
    const y = horizon + Math.round(Math.sin(t / 500 + x / 40) * 1.5)
    ctx.fillRect(x, snap(y, CELL), CELL, CELL - 1)
  }
  ctx.restore()
}
