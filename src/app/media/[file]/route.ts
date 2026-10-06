import { mediaFile, optimiseImage } from '@/lib/vault'
import { getVault } from '@/lib/vault/source'

// Vault images, statically generated at build: each referenced image in a few WebP widths, with
// all metadata stripped. Only images that Published notes reference exist here (docs/adr/0001).

export const dynamic = 'force-static'
export const dynamicParams = false

function variants() {
  return getVault().images.flatMap((img) =>
    img.widths.map((width) => ({ img, width, file: mediaFile(img.key, width) })),
  )
}

export function generateStaticParams() {
  return variants().map(({ file }) => ({ file }))
}

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const v = variants().find((x) => x.file === file)
  if (!v) return new Response('Not found', { status: 404 })
  const body = await optimiseImage(v.img.source, v.width)
  return new Response(new Uint8Array(body), {
    headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable' },
  })
}
