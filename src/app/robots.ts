import type { MetadataRoute } from 'next'
import { getContent } from '@/lib/content'

export default function robots(): MetadataRoute.Robots {
  const { site } = getContent()
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${site.url}/sitemap.xml` }
}
