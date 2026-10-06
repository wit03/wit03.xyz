import type { MetadataRoute } from 'next'
import { getContent } from '@/lib/content'
import { getVault } from '@/lib/vault/source'

export default function sitemap(): MetadataRoute.Sitemap {
  const { site } = getContent()
  const url = (p: string) => new URL(p, site.url).toString()
  return [
    { url: site.url, changeFrequency: 'monthly', priority: 1 },
    { url: url('/projects'), changeFrequency: 'weekly', priority: 0.8 },
    ...getVault().projects.map((p) => ({
      url: url(`/project/${p.slug}`),
      lastModified: p.lastUpdate,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ]
}
