import { describe, expect, it } from 'vitest'
import { skyAt } from './sky'

// Bangkok is UTC+7 all year, so local times below are UTC + 7h.
const bangkok = (iso: string) => new Date(`${iso}+07:00`)

describe('skyAt', () => {
  it('is night with stars at local midnight', () => {
    const sky = skyAt(bangkok('2025-10-06T00:00:00'), 'Asia/Bangkok')
    expect(sky.phase).toBe('night')
    expect(sky.stars).toBe(true)
    expect(sky.sun.up).toBe(false)
  })
  it('is day with the sun high at local noon', () => {
    const sky = skyAt(bangkok('2025-10-06T12:00:00'), 'Asia/Bangkok')
    expect(sky.phase).toBe('day')
    expect(sky.stars).toBe(false)
    // Bangkok (~13.7°N) in early October: the noon sun is roughly 75° up.
    expect(sky.sun.altitude).toBeGreaterThan(65)
  })
  it('is golden hour or dusk around local sunset', () => {
    // Bangkok sunset in early October is about 18:05.
    expect(['golden', 'dusk']).toContain(skyAt(bangkok('2025-10-06T17:55:00'), 'Asia/Bangkok').phase)
    expect(skyAt(bangkok('2025-10-06T18:15:00'), 'Asia/Bangkok').phase).toBe('dusk')
  })

  it('is dawn just before local sunrise', () => {
    // Bangkok sunrise in early October is about 06:05.
    expect(skyAt(bangkok('2025-10-06T05:55:00'), 'Asia/Bangkok').phase).toBe('dawn')
  })
  it('places the visitor by time zone, so one instant differs around the world', () => {
    const instant = bangkok('2025-10-06T12:00:00') // midnight in New York
    expect(skyAt(instant, 'Asia/Bangkok').phase).toBe('day')
    expect(skyAt(instant, 'America/New_York').phase).toBe('night')
  })

  it('falls back instead of throwing for an unknown time zone', () => {
    expect(() => skyAt(bangkok('2025-10-06T12:00:00'), 'Mars/Olympus_Mons')).not.toThrow()
  })

  it('estimates a zone missing from the table from its UTC offset', () => {
    // Asia/Kathmandu is UTC+5:45; noon there should read as day.
    const kathmanduNoon = new Date('2025-10-06T12:00:00+05:45')
    expect(skyAt(kathmanduNoon, 'Asia/Kathmandu').phase).toBe('day')
  })
  describe('moon', () => {
    // Reference dates from published lunar calendars (UTC): full moon 7 Oct 2025 03:48,
    // new moon 21 Oct 2025 12:25, last quarter 13 Oct 2025, first quarter 29 Oct 2025.

    it('is full, and up in the evening, on a full-moon night', () => {
      const sky = skyAt(bangkok('2025-10-06T22:00:00'), 'Asia/Bangkok')
      expect(sky.moon.fraction).toBeGreaterThan(0.95)
      expect(sky.moon.name).toBe('full')
      expect(sky.moon.up).toBe(true)
    })

    it('is almost invisible at new moon', () => {
      const sky = skyAt(new Date('2025-10-21T12:25:00Z'), 'Asia/Bangkok')
      expect(sky.moon.fraction).toBeLessThan(0.05)
      expect(sky.moon.name).toBe('new')
    })

    it('is lit on the right while waxing and on the left while waning, seen from the north', () => {
      const firstQuarter = skyAt(new Date('2025-10-29T12:00:00Z'), 'Asia/Bangkok').moon
      const lastQuarter = skyAt(new Date('2025-10-13T12:00:00Z'), 'Asia/Bangkok').moon
      expect(firstQuarter.waxing).toBe(true)
      expect(firstQuarter.litSide).toBe('right')
      expect(lastQuarter.waxing).toBe(false)
      expect(lastQuarter.litSide).toBe('left')
    })

    it('flips the lit side for the southern hemisphere', () => {
      const firstQuarter = skyAt(new Date('2025-10-29T12:00:00Z'), 'Australia/Sydney').moon
      expect(firstQuarter.litSide).toBe('left')
    })
  })
  describe('screen placement', () => {
    it('puts the morning sun in the east (left) and the afternoon sun in the west (right)', () => {
      const morning = skyAt(bangkok('2025-10-06T08:00:00'), 'Asia/Bangkok').sun
      const afternoon = skyAt(bangkok('2025-10-06T16:00:00'), 'Asia/Bangkok').sun
      expect(morning.x).toBeLessThan(0.5)
      expect(afternoon.x).toBeGreaterThan(0.5)
    })

    it('raises the sun on screen as it climbs', () => {
      const early = skyAt(bangkok('2025-10-06T07:00:00'), 'Asia/Bangkok').sun
      const noon = skyAt(bangkok('2025-10-06T12:00:00'), 'Asia/Bangkok').sun
      expect(noon.y).toBeGreaterThan(early.y)
      expect(noon.y).toBeLessThanOrEqual(1)
      expect(early.y).toBeGreaterThanOrEqual(0)
    })
  })

  describe('gradient', () => {
    const luminance = (hex: string) => {
      const n = parseInt(hex.slice(1), 16)
      return 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)
    }

    it('runs from the top of the sky to the horizon, darker at night than by day', () => {
      const night = skyAt(bangkok('2025-10-06T00:00:00'), 'Asia/Bangkok').gradient
      const day = skyAt(bangkok('2025-10-06T12:00:00'), 'Asia/Bangkok').gradient
      expect(night.length).toBeGreaterThanOrEqual(2)
      expect(luminance(night[0])).toBeLessThan(luminance(day[0]))
    })
  })
})
