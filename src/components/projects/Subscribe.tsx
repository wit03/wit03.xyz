import RssIcon from '@/components/projects/RssIcon'

// Subscribe links: on /projects for every Project, on a Project page for that one (or all).

const button =
  'step-ease inline-flex items-center gap-2 border border-line px-3 py-1 font-mono text-sm transition-colors duration-150 hover:border-ink hover:bg-ink hover:text-bg'

export default function Subscribe({ slug }: { slug?: string }) {
  if (!slug)
    return (
      <a href='/projects/rss.xml' className={`${button} justify-self-start`}>
        <RssIcon />
        Subscribe to all projects
      </a>
    )
  return (
    <div className='flex flex-wrap items-center gap-x-4 gap-y-2 border border-dashed border-line px-4 py-3'>
      <a href={`/project/${slug}/rss.xml`} className={button}>
        <RssIcon />
        Subscribe to this project
      </a>
      <a href='/projects/rss.xml' className='font-mono text-sm text-muted hover:text-ink'>
        or all projects
      </a>
    </div>
  )
}
