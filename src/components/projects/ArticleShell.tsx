import Link from 'next/link'
import type { ReactNode } from 'react'

// Project pages and the overview: the site's dark water and type, without the sky, gauge or creatures.

export default function ArticleShell({ children }: { children: ReactNode }) {
  return (
    <div className='article-water min-h-svh'>
      <div className='mx-auto box-content grid max-w-[760px] gap-10 px-7 pt-9 pb-30 max-sm:px-4'>
        <Link href='/' className='justify-self-start font-mono text-sm text-muted hover:text-ink'>
          ← back to the surface
        </Link>
        {children}
      </div>
    </div>
  )
}
