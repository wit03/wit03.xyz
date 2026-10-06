import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Ago from '@/components/projects/Ago'
import ArticleShell from '@/components/projects/ArticleShell'
import StatusPill from '@/components/projects/StatusPill'
import Subscribe from '@/components/projects/Subscribe'
import { formatDay, formatMonth, today } from '@/lib/dates'
import { external } from '@/lib/links'
import { getProject, getVault } from '@/lib/vault/source'

// One page per Published note: the intro, then Journey entries newest first.

export const dynamicParams = false

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return getVault().projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = getProject((await params).slug)
  if (!project) return {}
  return {
    title: `${project.name} · wit03`,
    description: project.summary,
    openGraph: { title: project.name, description: project.summary, url: `/project/${project.slug}` },
    alternates: {
      types: {
        'application/rss+xml': [
          { url: `/project/${project.slug}/rss.xml`, title: `wit03 · ${project.name}` },
          { url: '/projects/rss.xml', title: 'wit03 · Projects' },
        ],
      },
    },
  }
}

export default async function ProjectPage({ params }: Props) {
  const project = getProject((await params).slug)
  if (!project) notFound()
  const builtAt = today()

  return (
    <ArticleShell>
      <article className='grid gap-10'>
        <header className='grid gap-4'>
          <h1 className='text-[clamp(36px,6vw,56px)] leading-[1.05] font-semibold tracking-[-0.03em]'>
            {project.name}
          </h1>
          <p className='max-w-[56ch] text-lg text-muted'>{project.summary}</p>
          <div className='flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-sm text-muted'>
            <StatusPill status={project.status} />
            {project.started && <span>started {formatMonth(project.started)}</span>}
            {project.lastUpdate && (
              <span>
                last update <Ago date={project.lastUpdate} builtAt={builtAt} />
              </span>
            )}
            {project.links.map((l) => (
              <a key={l.href} href={l.href} {...external} className='text-accent underline-offset-4 hover:underline'>
                {l.label} ↗
              </a>
            ))}
          </div>
          {project.tags.length > 0 && (
            <ul className='flex flex-wrap gap-1.5'>
              {project.tags.map((t) => (
                <li key={t} className='border border-line px-1.5 font-mono text-[12px] leading-[20px] text-muted'>
                  {t}
                </li>
              ))}
            </ul>
          )}
        </header>

        <Subscribe slug={project.slug} />

        {project.intro && <div className='note-prose' dangerouslySetInnerHTML={{ __html: project.intro }} />}

        {project.entries.length > 0 && (
          <section className='grid gap-6' aria-labelledby='journey'>
            <div className='flex items-baseline justify-between border-b border-line pb-2'>
              <h2 id='journey' className='label'>
                Journey
              </h2>
              <span className='font-mono text-[13px] text-muted'>newest first</span>
            </div>
            <ol className='journey'>
              {project.entries.map((e) => (
                <li key={e.id} id={e.anchor} className='journey-entry scroll-mt-8'>
                  <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
                    <time dateTime={e.date} className='font-mono text-sm text-muted tabular-nums'>
                      {formatDay(e.date)}
                    </time>
                    <h3
                      className={`text-[21px] leading-snug tracking-[-0.015em] ${e.title ? 'font-semibold' : 'font-medium text-muted'}`}
                    >
                      {e.title ?? 'Journey entry'}
                    </h3>
                    <a href={`#${e.anchor}`} className='entry-anchor font-mono text-sm' aria-label='Link to this entry'>
                      #
                    </a>
                  </div>
                  <div className='note-prose' dangerouslySetInnerHTML={{ __html: e.html }} />
                </li>
              ))}
            </ol>
          </section>
        )}
      </article>
    </ArticleShell>
  )
}
