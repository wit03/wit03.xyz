import { getMoonIllumination, getMoonPosition, getPosition, getTimes } from 'suncalc'
import { locate } from '@/lib/locate'

// What the surface sky looks like for a visitor right now. Pure: time and time zone in,
// scene description out. The ocean layer draws it; nothing here touches the DOM.

export type SkyPhase = 'night' | 'dawn' | 'day' | 'golden' | 'dusk'

export type SkyBody = {
  /** Degrees above the horizon (negative when below). */
  altitude: number
  /** Degrees clockwise from north. */
  azimuth: number
  up: boolean
  /** Across the screen, 0 left to 1 right, as if facing the equator (east on the left in the north). */
  x: number
  /** Up the sky band, 0 at the horizon to 1 at the zenith. */
  y: number
}

export type MoonName =
  | 'new'
  | 'waxing crescent'
  | 'first quarter'
  | 'waxing gibbous'
  | 'full'
  | 'waning gibbous'
  | 'last quarter'
  | 'waning crescent'

export type SkyMoon = SkyBody & {
  /** Illuminated fraction, 0 (new) to 1 (full). */
  fraction: number
  waxing: boolean
  name: MoonName
  /** Which side of the disc is lit, as the visitor sees it. */
  litSide: 'left' | 'right'
}

export type Sky = {
  phase: SkyPhase
  stars: boolean
  sun: SkyBody
  moon: SkyMoon
  /** Sky colours from the top of the band down to the horizon. */
  gradient: string[]
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

// Facing the equator, the sun's path runs left to right: east to west in the north,
// and mirrored (east on the right) in the south.
function body(p: { altitude: number; azimuth: number }, lat: number): SkyBody {
  const facing = lat >= 0 ? 90 : 270
  const along = (((p.azimuth - facing) % 360) + 360) % 360
  return {
    altitude: p.altitude,
    azimuth: p.azimuth,
    up: p.altitude > 0,
    x: clamp01(along / 180),
    y: clamp01(p.altitude / 90),
  }
}

const GRADIENTS: Record<SkyPhase, string[]> = {
  night: ['#070b1f', '#131d45', '#23336a'],
  dawn: ['#2c3a78', '#8a6fa8', '#f2a88a'],
  day: ['#5aaee8', '#8ccaf2', '#d3ecfa'],
  golden: ['#4f8fd0', '#f0b877', '#f7d69a'],
  dusk: ['#1f2459', '#7a4a86', '#ef7f5c'],
}

// Lunar cycle position (0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter) to a name.
const MOON_NAMES: [number, MoonName][] = [
  [0.03, 'new'],
  [0.22, 'waxing crescent'],
  [0.28, 'first quarter'],
  [0.47, 'waxing gibbous'],
  [0.53, 'full'],
  [0.72, 'waning gibbous'],
  [0.78, 'last quarter'],
  [0.97, 'waning crescent'],
]

function moonName(phase: number): MoonName {
  return MOON_NAMES.find(([limit]) => phase < limit)?.[1] ?? 'new'
}

// Sun altitude bands, in degrees: civil twilight below the horizon, a low sun above it.
function phaseOf(altitude: number, morning: boolean): SkyPhase {
  if (altitude < -6) return 'night'
  if (altitude < 6) return morning ? 'dawn' : 'dusk'
  if (altitude < 12 && !morning) return 'golden'
  return 'day'
}

export function skyAt(date: Date, timeZone: string): Sky {
  const { lat, lng } = locate(timeZone, date)
  const sun = body(getPosition(date, lat, lng), lat)
  const morning = date < getTimes(date, lat, lng).solarNoon
  const phase = phaseOf(sun.altitude, morning)

  const light = getMoonIllumination(date)
  // Waxing moons are lit on the right from the northern hemisphere, on the left from the south.
  const litRight = light.waxing === lat >= 0
  const moon: SkyMoon = {
    ...body(getMoonPosition(date, lat, lng), lat),
    fraction: light.fraction,
    waxing: light.waxing,
    name: moonName(light.phase),
    litSide: litRight ? 'right' : 'left',
  }

  return { phase, stars: phase === 'night', sun, moon, gradient: GRADIENTS[phase] }
}
