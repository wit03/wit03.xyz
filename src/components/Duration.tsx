'use client'

import { useSyncExternalStore } from 'react'
import { currentYearMonth, formatDuration } from '@/lib/dates'

// Ongoing roles count up to the visitor's current month, so "3 mos" doesn't go stale
// between deploys. The server renders the build-time value; the client corrects it.

const noop = () => () => {}

export default function Duration({ start, end, builtAt }: { start: string; end?: string; builtAt: string }) {
  const today = useSyncExternalStore(
    noop,
    () => currentYearMonth(),
    () => builtAt,
  )
  return <>{formatDuration(start, end ?? today)}</>
}
