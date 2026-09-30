import type { ReactNode } from 'react'
import Duration from '@/components/Duration'
import type { Content, Section, SectionId, TimelineEntry } from '@/lib/content'
import { formatMonth, formatRange, formatYears } from '@/lib/dates'
import { external } from '@/lib/links'

function Shell({ section, children }: { section: Section; children: ReactNode }) {
  // The surface above is 82svh, so the first section clears the rest of the first screen
  // (18svh) plus a gap: only the sea shows under the hero, never half a section.
  return (
    <section
      id={section.id}
      className='mt-36 grid scroll-mt-10 gap-6 first:mt-[calc(18svh+5rem)] max-sm:mt-24 max-sm:first:mt-[calc(18svh+4rem)]'
    >
      <div className='flex items-baseline justify-between border-b border-line pb-2'>
        <h2 className='label' data-decode>
          {section.title}
        </h2>
        <span className='font-mono text-[13px] text-muted'>{section.depth} m</span>
      </div>
      {children}
    </section>
  )
}

function Timeline({ entries, builtAt, years }: { entries: TimelineEntry[]; builtAt: string; years?: boolean }) {
  return (
    <div className='timeline'>
      {entries.map((e) => {
        const current = !e.end
        return (
          <article key={e.slug} className='rv relative grid gap-2'>
            <i className='timeline-node' data-current={current || undefined} aria-hidden='true' />
            <div className='grid grid-cols-[1fr_auto] items-start gap-x-4 gap-y-1 max-sm:grid-cols-1'>
              <div>
                <h3 className='text-[21px] leading-snug font-semibold tracking-[-0.015em]'>{e.title}</h3>
                <p className='flex flex-wrap items-center gap-x-2 gap-y-1.5 text-base'>
                  <span className='font-mono text-sm text-muted'>at</span>
                  {e.orgUrl ? (
                    <a
                      href={e.orgUrl}
                      {...external}
                      className='font-medium text-accent underline-offset-4 hover:underline'
                    >
                      {e.org}
                    </a>
                  ) : (
                    <span className='font-medium text-accent'>{e.org}</span>
                  )}
                  {current && !years && <Tag className='border-current text-ok'>Current</Tag>}
                  {e.type && <Tag>{e.type}</Tag>}
                </p>
              </div>
              <div className='grid text-right font-mono text-sm whitespace-nowrap tabular-nums max-sm:flex max-sm:flex-wrap max-sm:gap-2 max-sm:text-left'>
                <span>{years ? formatYears(e.start, e.end) : formatRange(e.start, e.end)}</span>
                <small className='text-[13px] text-muted'>
                  {e.meta ?? <Duration start={e.start} end={e.end} builtAt={builtAt} />}
                </small>
              </div>
            </div>
            {e.html && <div className='prose-list' dangerouslySetInnerHTML={{ __html: e.html }} />}
          </article>
        )
      })}
    </div>
  )
}

function Tag({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`border border-line px-1.5 font-mono text-[12px] leading-[20px] tracking-[0.04em] text-muted uppercase ${className}`}
    >
      {children}
    </span>
  )
}

function Row({ href, children, arrow = '→' }: { href?: string; children: ReactNode; arrow?: string }) {
  if (!href)
    return (
      <div className='row rv'>
        {children}
        <span />
      </div>
    )
  return (
    <a href={href} {...external} className='row rv'>
      {children}
      <span className='row-arrow'>{arrow}</span>
    </a>
  )
}

function When({ children }: { children: ReactNode }) {
  return <span className='font-mono text-sm text-muted tabular-nums'>{children}</span>
}

function What({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  return (
    <span className='grid gap-0.5'>
      <b className='font-semibold'>{title}</b>
      <span className='text-base text-muted'>{sub}</span>
      {children}
    </span>
  )
}

export function renderSection(section: Section, c: Content, builtAt: string) {
  const bodies: Record<SectionId, () => ReactNode> = {
    now: () => (
      <ul className='grid gap-1.5'>
        {c.now.map((item) => (
          <li
            key={item}
            className='grid grid-cols-[18px_1fr] before:text-sm before:leading-7 before:text-accent before:content-["▸"]'
          >
            {item}
          </li>
        ))}
      </ul>
    ),
    work: () => <Timeline entries={c.work} builtAt={builtAt} />,
    education: () => <Timeline entries={c.education} builtAt={builtAt} years />,
    projects: () => (
      <div className='grid'>
        {c.projects.map((p) => (
          <Row key={p.slug} href={p.url}>
            <When>{p.name}</When>
            <What title={p.title} sub={p.summary}>
              {p.tags.length > 0 && (
                <span className='mt-1 flex flex-wrap gap-1.5'>
                  {p.tags.map((t) => (
                    <em key={t} className='border border-line px-1.5 font-mono text-[12px] text-muted not-italic'>
                      {t}
                    </em>
                  ))}
                </span>
              )}
            </What>
          </Row>
        ))}
      </div>
    ),
    talks: () => (
      <div className='grid'>
        {c.talks.map((t) => (
          <Row key={t.title} href={t.url} arrow='↗'>
            <When>{formatMonth(t.date)}</When>
            <What title={t.title} sub={t.where} />
          </Row>
        ))}
      </div>
    ),
    awards: () => (
      <div className='grid'>
        {c.awards.map((a) => (
          <Row key={`${a.year}-${a.title}`}>
            <When>{a.year}</When>
            <What title={a.title} sub={a.result} />
          </Row>
        ))}
      </div>
    ),
    offscreen: () => (
      <div className='rv grid grid-cols-3 gap-px border border-line bg-line max-sm:grid-cols-1'>
        {c.offscreen.map((o) => (
          <div key={o.title} className='grid gap-1 bg-water p-3.5'>
            <b className='font-pixel text-[13px] font-normal tracking-[0.06em] uppercase'>{o.title}</b>
            <span className='text-[15px] text-muted'>{o.text}</span>
          </div>
        ))}
      </div>
    ),
  }
  return (
    <Shell key={section.id} section={section}>
      {bodies[section.id]()}
    </Shell>
  )
}
