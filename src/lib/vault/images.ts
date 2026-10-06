import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { imageSize } from 'image-size'
import sharp from 'sharp'
import { escapeHtml, isImagePath } from './html'

// Images live in the Vault's attachments (docs/adr/0001). The reader resolves the ones Published
// notes reference; the /media route turns each into a few WebP widths with all metadata stripped.

export type VaultImage = {
  /** Content hash: changes when the image does, so URLs can be cached forever. */
  key: string
  /** Absolute path to the original in the Vault. */
  source: string
  /** Display size of the original, after EXIF rotation. */
  width: number
  height: number
  /** The WebP widths generated for it, smallest first. */
  widths: number[]
}

const VARIANTS = [480, 960, 1600]
const MAX = VARIANTS[VARIANTS.length - 1]

export const mediaFile = (key: string, width: number) => `${key}-${width}.webp`
export const mediaUrl = (key: string, width: number) => `/media/${mediaFile(key, width)}`

/** Every image in the Vault by lowercase filename, skipping dot-folders (.git, .obsidian, .trash). */
export function indexImages(root: string) {
  const byName = new Map<string, string>()
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue
      const full = path.join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.isFile() && isImagePath(e.name) && !byName.has(e.name.toLowerCase()))
        byName.set(e.name.toLowerCase(), full)
    }
  }
  walk(root)
  return byName
}

/** Reads an image's hash and display size, and decides which widths to offer. */
export function loadImage(source: string): VaultImage {
  const buffer = fs.readFileSync(source)
  const size = imageSize(buffer)
  const rotated = size.orientation !== undefined && size.orientation >= 5
  const width = (rotated ? size.height : size.width) ?? 0
  const height = (rotated ? size.width : size.height) ?? 0
  const widths = [...new Set([...VARIANTS.filter((w) => w < width), Math.min(width, MAX)])].sort((a, b) => a - b)
  return { key: crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 12), source, width, height, widths }
}

export function srcset(img: VaultImage) {
  return img.widths.map((w) => `${mediaUrl(img.key, w)} ${w}w`).join(', ')
}

/** The default src: the 960 variant when there is one, otherwise the largest. */
export function defaultSrc(img: VaultImage) {
  return mediaUrl(img.key, img.widths.includes(960) ? 960 : img.widths[img.widths.length - 1])
}

/** An <img> for a Vault image; `display` is Obsidian's |300 size, if given. */
export function imgTag(img: VaultImage, alt: string, display?: number) {
  const w = display ?? img.width
  const h = Math.round((w * img.height) / Math.max(1, img.width))
  return (
    `<img src="${defaultSrc(img)}" srcset="${srcset(img)}" sizes="(max-width: 800px) 100vw, 760px" ` +
    `width="${w}" height="${h}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">`
  )
}

/** One WebP width of an image, auto-rotated, with every bit of metadata (EXIF, GPS, XMP, ICC) dropped. */
export function optimiseImage(source: string, width: number) {
  return sharp(source, { animated: true })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()
}
