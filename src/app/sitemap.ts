import type { MetadataRoute } from 'next'
import { getContent } from '@/lib/content'

export default function sitemap(): MetadataRoute.Sitemap {
  const { site } = getContent()
  return [{ url: site.url, changeFrequency: 'monthly', priority: 1 }]
}
