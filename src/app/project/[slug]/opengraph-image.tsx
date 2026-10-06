import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import { getContent } from '@/lib/content'
import { formatDay, formatMonth } from '@/lib/dates'
import { OCEAN, PALETTE, STATUS_COLOR } from '@/lib/palette'
import { restingPixels } from '@/lib/sprite'
import { getProject, getVault } from '@/lib/vault/source'

// A Project's link preview: its Cover when it has one, otherwise a pixel-style card in the site's
// preview style with the name, Status and latest entry date.

export const alt = 'Project preview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const dynamicParams = false

export function generateStaticParams() {
  return getVault().projects.map((p) => ({ slug: p.slug }))
}

const C = PALETTE
const P = 9 // screen pixels per sprite pixel

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const project = getProject((await params).slug)
  if (!project) return new Response('Not found', { status: 404 })

  if (project.cover) {
    // Cropped to the preview shape; sharp drops the original's metadata on the way out.
    const png = await sharp(project.cover.source)
      .rotate()
      .resize(size.width, size.height, { fit: 'cover' })
      .png()
      .toBuffer()
    return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } })
  }

  const { site } = getContent()
  const px = restingPixels().filter((p) => p.y <= 16)
  const colour = STATUS_COLOR[project.status]
  // The latest Journey entry's date; a Project with no entries yet shows when it started instead.
  const latest = project.entries[0]?.date
  const when = latest
    ? `last update ${formatDay(latest)}`
    : project.started
      ? `started ${formatMonth(project.started)}`
      : ''
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 88px',
        background: `linear-gradient(${OCEAN.sea.night}, ${C.bg})`,
        color: C.ink,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, fontSize: 30, color: C.muted }}>
        <div style={{ display: 'flex', position: 'relative', width: 16 * P, height: 17 * P }}>
          {px.map((p, i) => (
            <div
              key={i}
              style={{ position: 'absolute', left: p.x * P, top: p.y * P, width: P, height: P, background: p.c }}
            />
          ))}
        </div>
        <div>{`${site.handle} · Projects`}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ fontSize: 104, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>{project.name}</div>
        <div style={{ fontSize: 32, color: C.muted, maxWidth: 940 }}>{project.summary}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 28 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            border: `3px solid ${colour}`,
            color: colour,
            padding: '4px 16px',
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          <div style={{ width: 14, height: 14, background: colour }} />
          {project.status}
        </div>
        {when && <div style={{ color: C.muted }}>{when}</div>}
        <div style={{ marginLeft: 'auto', color: C.accent }}>{`${new URL(site.url).host}/project/${project.slug}`}</div>
      </div>
    </div>,
    size,
  )
}
