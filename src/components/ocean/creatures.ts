import type { SectionId } from '@/lib/content'
import { OCEAN } from '@/lib/palette'
import type { Tokens } from '@/lib/tokens'
import { hash, type Point, snap } from './pixels'

// The ocean's residents, drawn as pixel sprites behind the page. Each creature is anchored to
// a depth (metres) or a section, so it shows up at the same point in the dive however long the
// page is. Everything tunable lives in CREATURES.

export type OceanView = {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  t: number
  scrollY: number
  /** Scroll position at which the dive reaches a given depth. */
  scrollForDepth: (depth: number) => number
  /** Configured depth of a section, if it's on the page. */
  sectionDepth: (id: SectionId) => number | undefined
  /** Screen y of the seafloor (the bottom of the dive). */
  floorY: number
  pointer: Point | null
  tokens: Tokens
  small: boolean
}

type Sprite = string[]

const FISH: Sprite[] = [
  ['#.#.', '.###', '#.#.'],
  ['..#.', '####', '..#.'],
]

/**
 * Who lives where. `depths`/`depth` place a creature in the dive, `parallax` sets how fast it
 * scrolls relative to the page, and `small` caps how many appear on phone-sized screens.
 * In sprites, `#` is body and `o` is an eye.
 */
const CREATURES = {
  manta: {
    depths: [10.5, 15],
    small: 1,
    speed: 0.018, // px per ms across the screen
    cell: 4,
    alpha: 0.3,
    parallax: 0.55,
    // Seen from above, swimming right: wings top and bottom, tail on the left.
    sprites: [
      [
        '.....#......',
        '.....##.....',
        '......###...',
        '......####..',
        '###########o',
        '......####..',
        '......###...',
        '.....##.....',
        '.....#......',
      ],
      [
        '............',
        '............',
        '.....####...',
        '......####..',
        '###########o',
        '......####..',
        '.....####...',
        '............',
        '............',
      ],
    ],
  },
  shark: {
    depth: 24,
    passEveryMs: 24000,
    crossingShare: 0.55, // share of each pass spent crossing the screen
    cell: 4,
    alpha: 0.32,
    parallax: 0.7,
    // Side view, swimming right.
    sprites: [
      [
        '........#.......',
        '.......##.......',
        '#....########...',
        '###############o',
        '#....#########..',
        '......#...#.....',
      ],
      [
        '........#.......',
        '.......##.......',
        '.....########...',
        '###############o',
        '##...#########..',
        '#.....#...#.....',
      ],
    ],
  },
  darters: {
    depthRange: [2, 21] as const,
    count: 9,
    small: 4,
    flee: 90, // px: how close the cursor gets before they bolt
    cell: 2,
    alpha: 0.4,
    parallax: 0.8,
    sprites: FISH,
  },
  school: {
    section: 'projects' as SectionId,
    fallbackDepth: 18,
    offsets: [
      [0, 0],
      [14, -8],
      [26, 6],
      [10, 12],
      [36, -2],
      [22, 20],
    ] as const,
    small: 4,
    speed: 0.035,
    cell: 3,
    alpha: 0.32,
    parallax: 0.7,
    sprites: FISH,
  },
  seafloor: {
    spacing: 64, // px between corals (varied)
    smallSpacing: 96,
    cell: 5,
    alpha: 0.34,
    corals: [
      { color: OCEAN.coral.branch, sprite: ['#.#.#', '#.#.#', '.###.', '..#..', '..#..'] },
      { color: OCEAN.coral.fan, sprite: ['.###.', '#####', '#####', '.###.', '..#..'] },
      { color: OCEAN.coral.brain, sprite: ['.###.', '#####', '#####'] },
      { color: OCEAN.coral.kelp, sprite: ['.#', '#.', '.#', '#.', '.#', '#.', '.#', '#.'] },
    ],
  },
}

const FRAME_MS = 1000 / 60

function drawSprite(ctx: CanvasRenderingContext2D, s: Sprite, x: number, y: number, cell: number, flip: boolean) {
  const w = s[0].length
  const body = ctx.fillStyle
  const x0 = snap(x, cell)
  const y0 = snap(y, cell)
  s.forEach((row, ry) => {
    for (let rx = 0; rx < w; rx++) {
      const ch = row[rx]
      if (ch === '.') continue
      ctx.fillStyle = ch === 'o' ? OCEAN.eye : body
      ctx.fillRect(x0 + (flip ? w - 1 - rx : rx) * cell, y0 + ry * cell, cell, cell)
    }
  })
  ctx.fillStyle = body
}

export function createOcean() {
  const darters = Array.from({ length: CREATURES.darters.count }, (_, i) => {
    const [lo, hi] = CREATURES.darters.depthRange
    return {
      home: hash(i + 1),
      depth: lo + hash(i + 11) * (hi - lo),
      dx: 0,
      dy: 0,
      vx: 0,
      vy: 0,
      phase: hash(i + 21) * 6,
    }
  })
  const shark = { dodgeAt: -1e9, dodgeDir: 1 }
  let lastT = 0

  function screenY(depth: number, parallax: number, v: OceanView) {
    return v.height * 0.5 + (v.scrollForDepth(depth) - v.scrollY) * parallax
  }

  function nearPointer(v: OceanView, x: number, y: number, r: number) {
    return v.pointer ? Math.hypot(v.pointer.x - x, v.pointer.y - y) < r : false
  }

  function drawMantas(v: OceanView) {
    const c = CREATURES.manta
    const depths = v.small ? c.depths.slice(0, c.small) : c.depths
    v.ctx.globalAlpha = c.alpha
    depths.forEach((depth, i) => {
      const y0 = screenY(depth, c.parallax, v)
      if (y0 < -60 || y0 > v.height + 60) return
      const dir = i % 2 ? -1 : 1
      const span = v.width + 120
      const along = (v.t * c.speed + i * span * 0.45) % span
      const x = dir > 0 ? along - 60 : v.width + 60 - along
      const y = y0 + Math.sin(v.t / 1800 + i) * 14
      drawSprite(v.ctx, c.sprites[Math.floor(v.t / 650 + i) % 2], x, y, c.cell, dir < 0)
    })
  }

  function drawShark(v: OceanView) {
    const c = CREATURES.shark
    const y0 = screenY(c.depth, c.parallax, v)
    if (y0 < -60 || y0 > v.height + 60) return
    const w = c.sprites[0][0].length * c.cell
    // One crossing per passEveryMs; the direction alternates each pass.
    const pass = Math.floor(v.t / c.passEveryMs)
    const k = (v.t % c.passEveryMs) / (c.passEveryMs * c.crossingShare)
    if (k > 1) return
    const dir = pass % 2 ? -1 : 1
    const travel = v.width + w * 2
    const x = dir > 0 ? -w + k * travel : v.width - k * travel
    // Shy: when the cursor gets close it darts away vertically, tail beating fast.
    const baseY = y0 + Math.sin(v.t / 1400) * 8
    if (v.t - shark.dodgeAt > 3000 && nearPointer(v, x + w / 2, baseY + 12, 130)) {
      shark.dodgeAt = v.t
      shark.dodgeDir = v.pointer && v.pointer.y < baseY ? 1 : -1
    }
    const dodging = v.t - shark.dodgeAt < 1600
    const y = baseY + (dodging ? Math.sin(((v.t - shark.dodgeAt) / 1600) * Math.PI) * 48 * shark.dodgeDir : 0)
    v.ctx.globalAlpha = c.alpha
    drawSprite(v.ctx, c.sprites[Math.floor(v.t / (dodging ? 90 : 300)) % 2], x, y, c.cell, dir < 0)
  }

  function drawDarters(v: OceanView, steps: number) {
    const c = CREATURES.darters
    const count = v.small ? c.small : darters.length
    // Scale the physics by elapsed frames so fleeing looks the same at 60 Hz and 144 Hz.
    const drag = Math.pow(0.97, steps)
    const settle = Math.pow(0.85, steps)
    v.ctx.globalAlpha = c.alpha
    for (let i = 0; i < count; i++) {
      const f = darters[i]
      const hx = f.home * v.width + Math.sin(v.t / 2600 + f.phase) * 30
      const hy = screenY(f.depth, c.parallax, v) + Math.sin(v.t / 1900 + f.phase) * 10
      if (hy < -30 || hy > v.height + 30) continue
      const x = hx + f.dx
      const y = hy + f.dy
      // Dart away from the cursor, then drift home.
      if (v.pointer && nearPointer(v, x, y, c.flee)) {
        const a = Math.atan2(y - v.pointer.y, x - v.pointer.x)
        f.vx += Math.cos(a) * 2.2 * steps
        f.vy += Math.sin(a) * 2.2 * steps
      }
      f.dx = (f.dx + f.vx * steps) * drag
      f.dy = (f.dy + f.vy * steps) * drag
      f.vx *= settle
      f.vy *= settle
      const facingLeft = f.vx < -0.2 || (Math.abs(f.vx) <= 0.2 && Math.cos(v.t / 2600 + f.phase) < 0)
      drawSprite(v.ctx, c.sprites[Math.floor(v.t / 240 + i) % 2], x, y, c.cell, facingLeft)
    }
  }

  function drawSchool(v: OceanView) {
    const c = CREATURES.school
    const fy = screenY(v.sectionDepth(c.section) ?? c.fallbackDepth, c.parallax, v)
    if (fy < -40 || fy > v.height + 40) return
    const offsets = v.small ? c.offsets.slice(0, c.small) : c.offsets
    const span = v.width + 160
    const fx0 = ((v.t * c.speed) % span) - 80
    v.ctx.globalAlpha = c.alpha
    for (const [dx, dy] of offsets) {
      const y = fy + dy + Math.sin(v.t / 600 + dx) * 2
      drawSprite(v.ctx, c.sprites[Math.floor(v.t / 220 + dx) % 2], fx0 + dx, y, c.cell, false)
    }
  }

  function drawSeafloor(v: OceanView) {
    const { ctx, floorY } = v
    const c = CREATURES.seafloor
    if (floorY > v.height + 10) return
    const floor = snap(floorY, c.cell)
    ctx.globalAlpha = c.alpha * 0.8
    ctx.fillStyle = OCEAN.sand
    for (let x = 0; x < v.width; x += c.cell) {
      const h = 1 + Math.round(hash(x) * 1.4)
      ctx.fillRect(x, floor - (h - 1) * c.cell, c.cell, h * c.cell)
    }
    ctx.globalAlpha = c.alpha
    const spacing = v.small ? c.smallSpacing : c.spacing
    for (let i = 0, x = 12; x < v.width - 12; i++, x += spacing * (0.6 + hash(i + 3) * 0.8)) {
      const coral = c.corals[Math.floor(hash(i + 7) * c.corals.length)]
      const rows = coral.sprite.length
      ctx.fillStyle = coral.color
      coral.sprite.forEach((row, ry) => {
        // Sway: the top leans with the current, the base stays planted.
        const lean = Math.round(Math.sin(v.t / 1100 + i) * ((rows - ry) / rows) * 1.2)
        for (let rx = 0; rx < row.length; rx++) {
          if (row[rx] === '.') continue
          ctx.fillRect(snap(x, c.cell) + (rx + lean) * c.cell, floor - (rows - ry + 1) * c.cell, c.cell, c.cell)
        }
      })
    }
  }

  return {
    draw(v: OceanView) {
      const steps = lastT ? Math.min(4, (v.t - lastT) / FRAME_MS) : 1
      lastT = v.t
      v.ctx.save()
      v.ctx.fillStyle = v.tokens.muted
      drawMantas(v)
      drawShark(v)
      drawSchool(v)
      drawDarters(v, steps)
      drawSeafloor(v)
      v.ctx.restore()
    },
  }
}
