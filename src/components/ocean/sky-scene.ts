import type { Sky } from '@/lib/sky'
import type { Tokens } from '@/lib/tokens'

// Draws the surface: a stepped sky gradient above a wavy waterline, stars at night, and the
// sun and moon where the visitor would see them. The band sits at the top of the page and
// scrolls away as the dive starts. Positions and phases come from the pure sky module.

const CELL = 3 // pixel size for the sun, moon and stars
const STEP = 6 // height of each gradient band, for the pixel look
const STARS = Array.from({ length: 36 }, (_, i) => ({
  x: (Math.sin(i * 12.9898) * 43758.5453) % 1,
  y: (Math.sin(i * 78.233) * 12345.6789) % 1,
  tw: i * 0.7,
}))

const SUN_COLORS: Record<Sky['phase'], string> = {
  night: '#ffd766',
  dawn: '#ff9a62',
  day: '#ffd766',
  golden: '#ffb347',
  dusk: '#ff8a5c',
}

export type SkyView = {
  ctx: CanvasRenderingContext2D
  width: number
  /** Screen y of the band's top edge (0 at the top of the page, negative once scrolled). */
  top: number
  height: number
  t: number
  tokens: Tokens
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return [n >> 16, (n >> 8) & 255, n & 255]
}

function mix(stops: string[], k: number) {
  const pos = Math.min(0.9999, Math.max(0, k)) * (stops.length - 1)
  const i = Math.floor(pos)
  const f = pos - i
  const a = hexToRgb(stops[i])
  const b = hexToRgb(stops[i + 1])
  return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * f)).join(',')})`
}

/** Fills a pixel disc; `lit(u, v)` decides per cell, with u and v in -1..1 across the disc. */
function disc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  paint: (u: number, v: number) => string | null,
) {
  for (let gy = -r; gy <= r; gy++) {
    for (let gx = -r; gx <= r; gx++) {
      if (gx * gx + gy * gy > r * r) continue
      const c = paint(gx / r, gy / r)
      if (!c) continue
      ctx.fillStyle = c
      ctx.fillRect(Math.round(cx / CELL + gx) * CELL, Math.round(cy / CELL + gy) * CELL, CELL, CELL)
    }
  }
}

export function drawSky(sky: Sky, v: SkyView) {
  const { ctx, width, top, height, t, tokens } = v
  if (top + height + 40 < 0) return
  const horizon = top + height
  // The theme sets contrast: a gentle tint on the light page, a fuller sky on the dark one.
  const strength = tokens.dark ? 0.85 : 0.45

  ctx.save()
  for (let y = 0; y < height; y += STEP) {
    ctx.globalAlpha = strength
    ctx.fillStyle = mix(sky.gradient, y / height)
    ctx.fillRect(0, top + y, width, STEP)
  }
  // fade the horizon colour down into the water
  for (let y = 0; y < 48; y += STEP) {
    ctx.globalAlpha = strength * (1 - y / 48) * 0.6
    ctx.fillStyle = sky.gradient[sky.gradient.length - 1]
    ctx.fillRect(0, horizon + y, width, STEP)
  }

  if (sky.stars) {
    ctx.fillStyle = '#ffffff'
    for (const s of STARS) {
      ctx.globalAlpha = strength * (0.5 + 0.4 * Math.sin(t / 700 + s.tw))
      const x = Math.abs(s.x) * width
      const y = top + Math.abs(s.y) * (height - 20)
      ctx.fillRect(Math.round(x / CELL) * CELL, Math.round(y / CELL) * CELL, CELL - 1, CELL - 1)
    }
  }

  const place = (b: { x: number; y: number }) => ({
    x: width * (0.08 + b.x * 0.84),
    y: horizon - 18 - b.y * (height - 40),
  })

  if (sky.sun.up) {
    const p = place(sky.sun)
    ctx.globalAlpha = 0.95
    disc(ctx, p.x, p.y, 4, (u, w) => (u * u + w * w > 0.7 ? SUN_COLORS[sky.phase] : '#fff3c4'))
  }

  if (sky.moon.up) {
    const p = place(sky.moon)
    const { fraction, litSide } = sky.moon
    // Terminator: a cell is lit when it lies past the ellipse k·√(1−v²) on the lit side.
    const k = 1 - 2 * fraction
    const dir = litSide === 'right' ? 1 : -1
    ctx.globalAlpha = sky.phase === 'night' ? 0.95 : 0.55
    disc(ctx, p.x, p.y, 4, (u, w) =>
      u * dir > k * Math.sqrt(Math.max(0, 1 - w * w)) ? '#f4f1e2' : 'rgba(244,241,226,.12)',
    )
  }

  // waterline
  ctx.globalAlpha = 0.6
  ctx.fillStyle = tokens.dark ? '#9fc4ff' : '#ffffff'
  for (let x = 0; x < width; x += CELL) {
    const y = horizon + Math.round(Math.sin(t / 500 + x / 40) * 1.5)
    ctx.fillRect(x, Math.round(y / CELL) * CELL, CELL, CELL - 1)
  }
  ctx.restore()
}
