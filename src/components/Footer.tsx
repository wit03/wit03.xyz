import type { Content } from '@/lib/content'
import { MAX_DEPTH } from '@/lib/depth'

export default function Footer({ site }: { site: Content['site'] }) {
  const host = new URL(site.url).host
  return (
    <footer
      id='contact'
      className='mt-36 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-4 font-mono text-xs text-muted'
    >
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
        {site.email && (
          <a href={`mailto:${site.email}`} className='text-ink underline-offset-4 hover:underline'>
            {site.email}
          </a>
        )}
        {site.location && <span>{site.location}</span>}
      </div>
      <div className='flex items-center gap-4'>
        <a
          href={`https://webring.wonderful.software#${host}`}
          title='วงแหวนเว็บ'
          aria-label='วงแหวนเว็บ (Thai webring)'
          className='text-muted hover:text-accent'
        >
          <svg width='20' height='20' viewBox='0 0 416 416' fill='none' aria-hidden='true'>
            <path
              fillRule='evenodd'
              clipRule='evenodd'
              d='M53 128.8l-16-8.2a192 192 0 1094.7-88.9l7.1 16.6A174 174 0 1153 128.8z'
              fill='currentColor'
            />
            <path
              d='M94.7 92.3L82 126.5 62.6 95.7l-36.4-1.4 23.3-28-9.9-35.1 33.9 13.5 30.3-20.3-2.4 36.4L130 83.3l-35.3 9z'
              fill='var(--accent)'
            />
          </svg>
        </a>
        <a href='#top' className='hover:text-ink'>
          {MAX_DEPTH} m · resurface ↑
        </a>
      </div>
    </footer>
  )
}
