// Small helpers shared by the canvas scenes.

export type Point = { x: number; y: number }

/** Snaps a coordinate to the pixel grid of the given cell size. */
export const snap = (v: number, cell: number) => Math.round(v / cell) * cell

/** Deterministic 0..1 noise, so layouts stay put between frames and reloads. */
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453
  return s - Math.floor(s)
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return [n >> 16, (n >> 8) & 255, n & 255]
}

/** Mixes two #rrggbb colours into another #rrggbb; k = 0 gives a, 1 gives b. */
export function mixHex(a: string, b: string, k: number) {
  const x = hexToRgb(a)
  const y = hexToRgb(b)
  return `#${x
    .map((v, i) =>
      Math.round(v + (y[i] - v) * k)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

/** Colour at position k (0..1) along a list of #rrggbb stops. */
export function alongStops(stops: readonly string[], k: number) {
  const pos = Math.min(0.9999, Math.max(0, k)) * (stops.length - 1)
  const i = Math.floor(pos)
  return mixHex(stops[i], stops[i + 1], pos - i)
}
