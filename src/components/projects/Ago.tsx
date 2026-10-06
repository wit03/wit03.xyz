'use client'

import { useSyncExternalStore } from 'react'
import { relativeDay, today } from '@/lib/dates'

// "3 days ago", counted from the visitor's today so it doesn't go stale between deploys.
// The server renders the build-time value; the client corrects it.

const noop = () => () => {}

export default function Ago({ date, builtAt }: { date: string; builtAt: string }) {
  const now = useSyncExternalStore(
    noop,
    () => today(),
    () => builtAt,
  )
  return <time dateTime={date}>{relativeDay(date, now)}</time>
}
