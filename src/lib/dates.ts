// Dates in content are "YYYY-MM" strings. Everything here works on those.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export type YearMonth = string

function parse(ym: YearMonth) {
  const [y, m] = ym.split('-').map(Number)
  return { y, m }
}

export function currentYearMonth(date = new Date()): YearMonth {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function formatMonth(ym: YearMonth) {
  const { y, m } = parse(ym)
  return `${MONTHS[m - 1]} ${y}`
}

/** "Jun 2025 – May 2026", "Jun – Aug 2023", "Jun 2026 – Present" */
export function formatRange(start: YearMonth, end?: YearMonth) {
  if (!end) return `${formatMonth(start)} – Present`
  const s = parse(start)
  const e = parse(end)
  if (s.y === e.y) return `${MONTHS[s.m - 1]} – ${MONTHS[e.m - 1]} ${e.y}`
  return `${formatMonth(start)} – ${formatMonth(end)}`
}

export function formatYears(start: YearMonth, end?: YearMonth) {
  const s = parse(start).y
  return end ? `${s} – ${parse(end).y}` : `${s} – Present`
}

/** Inclusive month count, LinkedIn-style: Jun–Aug is 3 mos. */
export function formatDuration(start: YearMonth, end: YearMonth) {
  const s = parse(start)
  const e = parse(end)
  const total = Math.max(1, (e.y - s.y) * 12 + (e.m - s.m) + 1)
  const years = Math.floor(total / 12)
  const months = total % 12
  const parts = []
  if (years) parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`)
  if (months) parts.push(`${months} ${months === 1 ? 'mo' : 'mos'}`)
  return parts.join(' ')
}

// Journey entries carry full dates, "YYYY-MM-DD".

export function today(date = new Date()) {
  return `${currentYearMonth(date)}-${String(date.getDate()).padStart(2, '0')}`
}

/** "3 Oct 2026" */
export function formatDay(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

/** "today", "yesterday", "5 days ago", "3 weeks ago", "2 months ago", "1 year ago" */
export function relativeDay(ymd: string, now: string) {
  const days = Math.round((Date.parse(`${now}T00:00:00Z`) - Date.parse(`${ymd}T00:00:00Z`)) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'} ago`
  if (days < 14) return unit(days, 'day')
  if (days < 60) return unit(Math.round(days / 7), 'week')
  if (days < 365) return unit(Math.round(days / 30), 'month')
  return unit(Math.round(days / 365), 'year')
}
