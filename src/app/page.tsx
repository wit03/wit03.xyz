import DiveLayer from '@/components/DiveLayer'
import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import Reveal from '@/components/Reveal'
import { renderSection } from '@/components/Sections'
import { getContent } from '@/lib/content'
import { currentYearMonth, today } from '@/lib/dates'
import { getVault } from '@/lib/vault/source'

export default function Home() {
  const content = getContent()
  const { site } = content
  const builtAt = currentYearMonth()
  // The carousel previews live work; archived Projects stay on /projects. No Projects, no stop.
  const published = getVault().projects
  const projects = published.filter((p) => p.status !== 'archived')
  const sections = content.sections.filter((s) => s.id !== 'projects' || projects.length > 0)
  const links = [
    ...site.links,
    ...(site.email ? [{ label: 'Email', href: `mailto:${site.email}` }] : []),
    ...(site.resume ? [{ label: 'Résumé', href: site.resume }] : []),
  ]
  // The nav links to /projects whenever anything is published, even if only archived Projects remain.
  const nav = content.sections.filter(
    (s) => ['work', 'education'].includes(s.id) || (s.id === 'projects' && published.length > 0),
  )
  const first = sections[0]

  return (
    <>
      <DiveLayer sections={sections} />
      <div className='relative z-10 mx-auto box-content max-w-[760px] px-7 pb-30 max-[900px]:pr-24 max-sm:pr-10 max-sm:pl-4'>
        {/* The surface: most of the first screen is sky, with the waterline along its bottom edge
            and a strip of sea showing beneath it. */}
        <div id='top' className='flex min-h-[82svh] flex-col pt-7 pb-14 max-sm:pt-5'>
          {/* Phones: logo on top, section links spread beneath. */}
          <nav className='flex items-center gap-x-4 gap-y-3 max-sm:flex-wrap'>
            <a href='#top' className='font-pixel text-[20px] tracking-[0.02em]'>
              {site.handle}
              <span className='text-accent'>.xyz</span>
            </a>
            <ul className='ml-auto flex flex-wrap gap-6 font-mono text-[15px] max-sm:order-3 max-sm:text-sm max-sm:ml-0 max-sm:w-full max-sm:justify-between max-sm:gap-2'>
              {nav.map((s) => (
                <li key={s.id}>
                  <a href={s.id === 'projects' ? '/projects' : `#${s.id}`} className='text-muted hover:text-ink'>
                    {s.id}
                  </a>
                </li>
              ))}
              <li>
                <a href='#contact' className='text-muted hover:text-ink'>
                  contact
                </a>
              </li>
            </ul>
          </nav>

          <Hero handle={site.handle} name={site.name} tagline={site.tagline} status={site.status} links={links} />

          {first && (
            <a
              href={`#${first.id}`}
              className='label mx-auto flex flex-col items-center gap-1 text-muted hover:text-ink'
            >
              dive
              <span className='pulse' aria-hidden='true'>
                ▾
              </span>
            </a>
          )}
        </div>

        <main>{sections.map((s) => renderSection(s, content, { builtAt, buildDay: today(), projects }))}</main>

        <Footer site={site} />
      </div>
      <Reveal />
    </>
  )
}
