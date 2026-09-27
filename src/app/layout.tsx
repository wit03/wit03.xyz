import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Geist, Geist_Mono, Silkscreen } from 'next/font/google'
import { getContent } from '@/lib/content'
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f1f3f4' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0e12' },
  ],
}

// Applies a stored theme choice before first paint so there's no flash.
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${silkscreen.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
