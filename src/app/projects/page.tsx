import type { Metadata } from 'next'
import Link from 'next/link'
import Ago from '@/components/projects/Ago'
import ArticleShell from '@/components/projects/ArticleShell'
import Cover from '@/components/projects/Cover'
import StatusPill from '@/components/projects/StatusPill'
import Subscribe from '@/components/projects/Subscribe'
import { today } from '@/lib/dates'
import { getVault } from '@/lib/vault/source'

// The Projects overview: every Published Project, archived ones too, most recently updated first.

export const metadata: Metadata = {
  title: 'Projects · wit03',
  description: 'Side projects, written up as they happen.',
  openGraph: { title: 'Projects', description: 'Side projects, written up as they happen.', url: '/projects' },
  alternates: { types: { 'application/rss+xml': [{ url: '/projects/rss.xml', title: 'wit03 · Projects' }] } },
}

export default function ProjectsPage() {
  const { projects } = getVault()
  const builtAt = today()

  return (
    <ArticleShell>
      <header className='grid gap-4'>
        <h1 className='text-[clamp(36px,6vw,56px)] leading-[1.05] font-semibold tracking-[-0.03em]'>Projects</h1>
        <p className='max-w-[56ch] text-lg text-muted'>
          Side projects, written up as they happen. Each one is a running journal: what it is, then every step along the
          way.
        </p>
        <Subscribe />
      </header>

      {projects.length === 0 ? (
        <p className='border border-dashed border-line px-5 py-8 text-center font-mono text-sm text-muted'>
          Nothing surfaced yet.
        </p>
      ) : (
        <ul className='grid'>
          {projects.map((p) => (
            <li key={p.slug} className={p.status === 'archived' ? 'opacity-60 hover:opacity-100' : ''}>
              <Link
                href={`/project/${p.slug}`}
                className='project-row grid grid-cols-[150px_1fr_auto] items-center gap-5 border-t border-line px-2 py-4 max-sm:grid-cols-[96px_1fr] max-sm:gap-4'
              >
                <Cover
                  slug={p.slug}
                  status={p.status}
                  name={p.name}
                  image={p.cover}
                  sizes='150px'
                  className='border border-line'
                />
                <span className='grid min-w-0 gap-1'>
                  <span className='flex flex-wrap items-center gap-x-3 gap-y-1'>
                    <b className='text-[19px] font-semibold tracking-[-0.01em]'>{p.name}</b>
                    <StatusPill status={p.status} />
                  </span>
                  <span className='text-base text-muted'>{p.summary}</span>
                  {p.lastUpdate && (
                    <span className='font-mono text-[13px] text-muted'>
                      last update <Ago date={p.lastUpdate} builtAt={builtAt} />
                    </span>
                  )}
                </span>
                <span className='row-arrow max-sm:hidden'>→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ArticleShell>
  )
}
