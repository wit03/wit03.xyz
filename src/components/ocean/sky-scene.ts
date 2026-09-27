import { OCEAN } from '@/lib/palette'
import type { Sky } from '@/lib/sky'
import type { Tokens } from '@/lib/tokens'
import { alongStops, hash, mixHex, snap } from './pixels'

// Draws the surface: a stepped sky gradient above a wavy waterline, stars at night, and the
// sun and moon where the visitor would see them. The band sits at the top of the page, fades
// as the dive deepens, and blends into the water below. Positions and phases come from the
// pure sky module.

const CELL = 3 // pixel size for the sun, moon and stars
const STEP = 6 // height of each gradient band, for the pixel look
const BLEND = 48 // px below the waterline where the sky colour blends into the water
const STARS = Array.from({ length: 36 }, (_, i) => ({ x: hash(i + 101), y: hash(i + 201), tw: i * 0.7 }))

export type SkyView = {
  ctx: CanvasRenderingContext2D
  width: number
  /** Screen y of the band's top edge (0 at the top of the page, negative once scrolled). */
  top: number
  height: number
  t: number
  tokens: Tokens
  /** 1 at the surface, falling to 0 by the first section's depth. */
  visibility: number
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
  const { ctx, width, top, height, t, tokens, visibility, water } = v
  if (visibility <= 0 || top + height + BLEND < 0) return
  const horizon = top + height
  // The theme sets contrast: a gentle tint on the light page, a fuller sky on the dark one.
  const strength = (tokens.dark ? 0.85 : 0.45) * visibility
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
    ctx.globalAlpha = 0.95 * visibility
    disc(ctx, p.x, p.y, 4, (u, w) => (u * u + w * w > 0.7 ? rim : OCEAN.sun.core))
  }

  if (sky.moon.up) {
    const p = place(sky.moon)
    const { fraction, litSide } = sky.moon
    // Terminator: a cell is lit when it lies past the ellipse k·√(1−v²) on the lit side.
    const k = 1 - 2 * fraction
    const dir = litSide === 'right' ? 1 : -1
    ctx.globalAlpha = (sky.phase === 'night' ? 0.95 : 0.55) * visibility
    disc(ctx, p.x, p.y, 4, (u, w) =>
      u * dir > k * Math.sqrt(Math.max(0, 1 - w * w)) ? OCEAN.moon.lit : OCEAN.moon.dark,
    )
  }

  ctx.globalAlpha = 0.6 * visibility
  ctx.fillStyle = tokens.dark ? OCEAN.waterline.dark : OCEAN.waterline.light
  for (let x = 0; x < width; x += CELL) {
    const y = horizon + Math.round(Math.sin(t / 500 + x / 40) * 1.5)
    ctx.fillRect(x, snap(y, CELL), CELL, CELL - 1)
  }
  ctx.restore()
}
