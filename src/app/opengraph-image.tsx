import { ImageResponse } from 'next/og'
import { getContent } from '@/lib/content'
import { SPRITE_H, restingPixels } from '@/lib/sprite'

export const alt = 'wit03, pixel-art avatar with round glasses'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const P = 18 // screen pixels per sprite pixel

export default function OpengraphImage() {
  const { site } = getContent()
  const px = restingPixels('#2f4fe0')
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 72,
        padding: '0 96px',
        background: '#f1f3f4',
        color: '#101418',
      }}
    >
      <div style={{ display: 'flex', position: 'relative', width: 16 * P, height: SPRITE_H * P, flexShrink: 0 }}>
        {px.map((p, i) => (
          <div
            key={i}
            style={{ position: 'absolute', left: p.x * P, top: p.y * P, width: P, height: P, background: p.c }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 136, fontWeight: 700, letterSpacing: -6, lineHeight: 1 }}>{site.handle}</div>
        <div style={{ fontSize: 34, color: '#5b6570' }}>{site.name}</div>
        <div style={{ fontSize: 28, color: '#5b6570', maxWidth: 620, marginTop: 12 }}>{site.tagline}</div>
        <div style={{ display: 'flex', marginTop: 20, fontSize: 24, color: '#2f4fe0' }}>{new URL(site.url).host}</div>
      </div>
    </div>,
    size,
  )
}
