import { getContent } from '@/lib/content'
import { projectsFeed } from '@/lib/vault'
import { getVault } from '@/lib/vault/source'

// The Projects feed: every Journey entry across all Projects.

export const dynamic = 'force-static'

export function GET() {
  return new Response(projectsFeed(getVault(), getContent().site), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
