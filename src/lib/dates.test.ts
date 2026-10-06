import { describe, expect, it } from 'vitest'
import { formatDay, relativeDay } from '@/lib/dates'

describe('formatDay', () => {
  it('writes a full date the way the site shows it', () => {
    expect(formatDay('2026-10-03')).toBe('3 Oct 2026')
  })
})

describe('relativeDay', () => {
  it.each([
    ['2026-10-06', 'today'],
    ['2026-10-05', 'yesterday'],
    ['2026-10-01', '5 days ago'],
    ['2026-09-15', '3 weeks ago'],
    ['2026-07-06', '3 months ago'],
    ['2025-10-06', '1 year ago'],
  ])('%s is %s on 2026-10-06', (date, expected) => {
    expect(relativeDay(date, '2026-10-06')).toBe(expected)
  })
})
