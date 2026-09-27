import DiveLayer from '@/components/DiveLayer'
import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import Reveal from '@/components/Reveal'
import { renderSection } from '@/components/Sections'
import ThemeToggle from '@/components/ThemeToggle'
import { getContent } from '@/lib/content'
import { currentYearMonth } from '@/lib/dates'

export default function Home() {
  const content = getContent()
  const { site, sections } = content
  const builtAt = currentYearMonth()
  const links = [
    ...site.links,
    ...(site.email ? [{ label: 'Email', href: `mailto:${site.email}` }] : []),
    ...(site.resume ? [{ label: 'Résumé', href: site.resume }] : []),
  ]
  const nav = sections.filter((s) => ['work', 'education', 'projects'].includes(s.id))

  return (
    <>
      <DiveLayer sections={sections} />
      <div className='relative z-10 mx-auto box-content max-w-[660px] px-7 pt-7 pb-30 max-[900px]:pr-24 max-sm:pr-10 max-sm:pl-4 max-sm:pt-5'>
        {/* Phones: logo and theme toggle share the top row, section links sit beneath. */}
        <nav className='flex items-center gap-x-4 gap-y-3 max-sm:flex-wrap'>
          <a href='#top' className='font-pixel text-[15px] tracking-[0.02em]'>
            {site.handle}
            <span className='text-accent'>.xyz</span>
          </a>
          <ul className='ml-auto flex flex-wrap gap-4 font-mono text-xs max-sm:order-3 max-sm:ml-0 max-sm:w-full max-sm:justify-between max-sm:gap-2'>
            {nav.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className='text-muted hover:text-ink'>
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
          <div className='max-sm:order-2 max-sm:ml-auto'>
            <ThemeToggle />
          </div>
        </nav>

        <main>
          <Hero handle={site.handle} name={site.name} tagline={site.tagline} status={site.status} links={links} />
          {sections.map((s) => renderSection(s, content, builtAt))}
        </main>

        <Footer site={site} />
      </div>
      <Reveal />
    </>
  )
}
