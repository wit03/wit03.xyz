import { ImageResponse } from 'next/og'
import { PALETTE } from '@/lib/palette'
import { restingPixels } from '@/lib/sprite'

// Favicon: the avatar's head (rows 1–16), 2px per sprite pixel.

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  const px = restingPixels(PALETTE.light.accent).filter((p) => p.y >= 1 && p.y <= 16)
  return new ImageResponse(
    <div style={{ display: 'flex', position: 'relative', width: 32, height: 32 }}>
      {px.map((p, i) => (
        <div
          key={i}
          style={{ position: 'absolute', left: p.x * 2, top: (p.y - 1) * 2, width: 2, height: 2, background: p.c }}
        />
      ))}
    </div>,
    size,
  )
}
