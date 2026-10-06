import { STATUS_COLOR } from '@/lib/palette'
import { type Status, type VaultImage, defaultSrc, srcset } from '@/lib/vault'

// A Project's Cover: its image when it has one, cropped to the card shape. Otherwise a pixel skyline
// stands in, drawn from the slug so each Project keeps the same one, lit in its Status colour.

const W = 72
const H = 34

function seeded(text: string) {
  let s = [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32
}

export default function Cover({
  slug,
  status,
  name,
  image,
  sizes = '300px',
  className = '',
}: {
  slug: string
  status: Status
  name: string
  image?: VaultImage
  /** The rendered width, for picking the right srcset entry. */
  sizes?: string
  className?: string
}) {
  if (image)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Vault images are pre-sized WebP from /media
      <img
        src={defaultSrc(image)}
        srcSet={srcset(image)}
        sizes={sizes}
        width={image.width}
        height={image.height}
        alt={`${name}: cover`}
        loading='lazy'
        decoding='async'
        className={`block aspect-[72/34] w-full object-cover ${className}`}
      />
    )
  const r = seeded(slug)
  const stars = Array.from({ length: 16 }, () => [Math.floor(r() * W), Math.floor(r() * H * 0.5)])
  const blocks: { x: number; w: number; h: number; windows: [number, number][] }[] = []
  for (let x = 0; x < W;) {
    const w = 3 + Math.floor(r() * 6)
    const h = Math.floor(H * (0.2 + r() * 0.45))
    const windows: [number, number][] = []
    for (let wy = H - h + 2; wy < H - 2; wy += 3)
      for (let wx = x + 1; wx < x + w - 1; wx += 2) if (r() > 0.55) windows.push([wx, wy])
    blocks.push({ x, w, h, windows })
    x += w + 1
  }
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`block aspect-[72/34] w-full ${className}`}
      shapeRendering='crispEdges'
      role='img'
      aria-label={`${name}: placeholder cover`}
    >
      <defs>
        <linearGradient id={`sky-${slug}`} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0' stopColor='#0d1430' />
          <stop offset='1' stopColor='#1d2a5c' />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#sky-${slug})`} />
      {stars.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width='1' height='1' fill='#fff' opacity='0.7' />
      ))}
      {blocks.map((b) => (
        <g key={b.x}>
          <rect x={b.x} y={H - b.h} width={b.w} height={b.h} fill='#0a0f22' />
          {b.windows.map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width='1' height='1' fill={STATUS_COLOR[status]} />
          ))}
        </g>
      ))}
      <rect y={H - 2} width={W} height='2' fill={STATUS_COLOR[status]} opacity='0.9' />
    </svg>
  )
}
