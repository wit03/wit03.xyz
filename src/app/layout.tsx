import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Geist, Geist_Mono, Silkscreen } from 'next/font/google'
import { getContent } from '@/lib/content'
import { PALETTE } from '@/lib/palette'
import './globals.css'

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })
const silkscreen = Silkscreen({ variable: '--font-silkscreen', subsets: ['latin'], weight: '400' })

const { site } = getContent()

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: `${site.handle} · ${site.name}`,
  description: site.description,
  openGraph: {
    type: 'website',
    url: site.url,
    siteName: site.handle,
    title: `${site.handle} · ${site.name}`,
    description: site.description,
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport: Viewport = {
  themeColor: PALETTE.bg,
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' className={`${geist.variable} ${geistMono.variable} ${silkscreen.variable}`}>
      <body>{children}</body>
    </html>
  )
}
