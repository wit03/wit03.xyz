import { getContent } from '@/lib/content'
import { projectFeed } from '@/lib/vault'
import { getProject, getVault } from '@/lib/vault/source'

// A Project feed: only this Project's Journey entries.

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return getVault().projects.map((p) => ({ slug: p.slug }))
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const project = getProject((await params).slug)
  if (!project) return new Response('Not found', { status: 404 })
  return new Response(projectFeed(project, getContent().site), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
