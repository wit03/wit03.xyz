import type { Tokens } from '@/lib/tokens'

// The ocean's residents, drawn as pixel sprites behind the page. Each creature is anchored to
// a depth (metres), so it shows up at the same point in the dive however long the page is.
// Tune who lives where in CREATURES and SEAFLOOR below.

export type OceanView = {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  t: number
  scrollY: number
  /** Scroll position at which the dive reaches a given depth. */
  scrollForDepth: (depth: number) => number
  /** Configured depth of a section, if it's on the page. */
  sectionDepth: (id: string) => number | undefined
  /** Screen y of the seafloor (the bottom of the dive). */
  floorY: number
  pointer: { x: number; y: number } | null
  tokens: Tokens
  small: boolean
}

type Sprite = string[]

// Seen from above, swimming right: wings top and bottom, tail on the left.
const MANTA: Sprite[] = [
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
]
// Side view, swimming right.
const SHARK: Sprite[] = [
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
]
const FISH: Sprite[] = [
  ['#.#.', '.###', '#.#.'],
  ['..#.', '####', '..#.'],
]
const SCHOOL: [number, number][] = [
  [0, 0],
  [14, -8],
  [26, 6],
  [10, 12],
  [36, -2],
  [22, 20],
]

/** Where each kind lives and how it moves. */
export const CREATURES = {
  manta: { depths: [10.5, 15], cell: 4, speed: 0.018, alpha: 0.3, parallax: 0.55 },
  shark: { depth: 24, cell: 4, alpha: 0.32, parallax: 0.7, passEveryMs: 24000, crossingShare: 0.55 },
  darters: { count: 9, depthRange: [2, 21] as [number, number], cell: 2, alpha: 0.4, parallax: 0.8, flee: 90 },
  school: { section: 'projects', fallbackDepth: 18, cell: 3, speed: 0.035, alpha: 0.32, parallax: 0.7 },
}

const CORALS: { sprite: Sprite; color: string }[] = [
  { sprite: ['#.#.#', '#.#.#', '.###.', '..#..', '..#..'], color: '#e98ca0' },
  { sprite: ['.###.', '#####', '#####', '.###.', '..#..'], color: '#f0a35e' },
  { sprite: ['.###.', '#####', '#####'], color: '#b28ad9' },
  { sprite: ['.#', '#.', '.#', '#.', '.#', '#.', '.#', '#.'], color: '#6fbf8e' },
]
export const SEAFLOOR = { cell: 5, spacing: 64, alpha: 0.55, sand: '#d9c79a' }

function drawSprite(ctx: CanvasRenderingContext2D, s: Sprite, x: number, y: number, cell: number, flip: boolean) {
  const w = s[0].length
  s.forEach((row, ry) => {
    for (let rx = 0; rx < w; rx++) {
      const ch = row[rx]
      if (ch === '.') continue
      const cx = flip ? w - 1 - rx : rx
      if (ch === 'o') {
        const prev = ctx.fillStyle
        ctx.fillStyle = 'rgba(255,255,255,.7)'
        ctx.fillRect(Math.round(x / cell) * cell + cx * cell, Math.round(y / cell) * cell + ry * cell, cell, cell)
        ctx.fillStyle = prev
        continue
      }
      ctx.fillRect(Math.round(x / cell) * cell + cx * cell, Math.round(y / cell) * cell + ry * cell, cell, cell)
    }
  })
}

// Deterministic 0..1 noise so layouts stay put between frames and reloads.
const hash = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453
  return s - Math.floor(s)
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

  function screenY(depth: number, parallax: number, v: OceanView) {
    return v.height * 0.5 + (v.scrollForDepth(depth) - v.scrollY) * parallax
  }

  function nearPointer(v: OceanView, x: number, y: number, r: number) {
    return v.pointer ? Math.hypot(v.pointer.x - x, v.pointer.y - y) < r : false
  }

  function drawMantas(v: OceanView) {
    const c = CREATURES.manta
    const { ctx } = v
    ctx.globalAlpha = c.alpha
    c.depths.forEach((depth, i) => {
      const y0 = screenY(depth, c.parallax, v)
      if (y0 < -60 || y0 > v.height + 60) return
      const dir = i % 2 ? -1 : 1
      const span = v.width + 120
      const along = (v.t * c.speed + i * span * 0.45) % span
      const x = dir > 0 ? along - 60 : v.width + 60 - along
      const y = y0 + Math.sin(v.t / 1800 + i) * 14
      const frame = Math.floor(v.t / 650 + i) % 2
      drawSprite(ctx, MANTA[frame], x, y, c.cell, dir < 0)
    })
  }

  function drawShark(v: OceanView) {
    const c = CREATURES.shark
    const { ctx } = v
    const y0 = screenY(c.depth, c.parallax, v)
    if (y0 < -60 || y0 > v.height + 60) return
    const w = SHARK[0][0].length * c.cell
    // One crossing per passEveryMs, taking crossingShare of it; direction alternates each pass.
    const pass = Math.floor(v.t / c.passEveryMs)
    const k = (v.t % c.passEveryMs) / (c.passEveryMs * c.crossingShare)
    if (k > 1) return
    const dir = pass % 2 ? -1 : 1
    const travel = v.width + w * 2
    const x = dir > 0 ? -w + k * travel : v.width - k * travel
    // Shy: when the cursor gets close it darts away vertically, tail beating fast.
    const sinceDodge = v.t - shark.dodgeAt
    const baseY = y0 + Math.sin(v.t / 1400) * 8
    if (sinceDodge > 3000 && nearPointer(v, x + w / 2, baseY + 12, 130)) {
      shark.dodgeAt = v.t
      shark.dodgeDir = v.pointer && v.pointer.y < baseY ? 1 : -1
    }
    const dodging = v.t - shark.dodgeAt < 1600
    const y = baseY + (dodging ? Math.sin(((v.t - shark.dodgeAt) / 1600) * Math.PI) * 48 * shark.dodgeDir : 0)
    ctx.globalAlpha = c.alpha
    drawSprite(ctx, SHARK[Math.floor(v.t / (dodging ? 90 : 300)) % 2], x, y, c.cell, dir < 0)
  }

  function drawDarters(v: OceanView) {
    const c = CREATURES.darters
    const { ctx } = v
    const count = v.small ? Math.ceil(darters.length / 2) : darters.length
    ctx.globalAlpha = c.alpha
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
        f.vx += Math.cos(a) * 2.2
        f.vy += Math.sin(a) * 2.2
      }
      f.dx = (f.dx + f.vx) * 0.97
      f.dy = (f.dy + f.vy) * 0.97
      f.vx *= 0.85
      f.vy *= 0.85
      const facingLeft = f.vx < -0.2 || (Math.abs(f.vx) <= 0.2 && Math.cos(v.t / 2600 + f.phase) < 0)
      drawSprite(ctx, FISH[Math.floor(v.t / 240 + i) % 2], x, y, c.cell, facingLeft)
    }
  }

  function drawSchool(v: OceanView) {
    const c = CREATURES.school
    const { ctx } = v
    const fy = screenY(v.sectionDepth(c.section) ?? c.fallbackDepth, c.parallax, v)
    if (fy < -40 || fy > v.height + 40) return
    const span = v.width + 160
    const fx0 = ((v.t * c.speed) % span) - 80
    ctx.globalAlpha = c.alpha
    for (const [dx, dy] of SCHOOL) {
      drawSprite(
        ctx,
        FISH[Math.floor(v.t / 220 + dx) % 2],
        fx0 + dx,
        fy + dy + Math.sin(v.t / 600 + dx) * 2,
        c.cell,
        false,
      )
    }
  }

  function drawSeafloor(v: OceanView) {
    const { ctx, floorY } = v
    const { cell, spacing, alpha, sand } = SEAFLOOR
    if (floorY > v.height + 10) return
    ctx.globalAlpha = alpha * 0.8
    ctx.fillStyle = sand
    for (let x = 0; x < v.width; x += cell) {
      const h = 1 + Math.round(hash(x) * 1.4)
      ctx.fillRect(x, Math.round(floorY / cell) * cell - (h - 1) * cell, cell, h * cell)
    }
    ctx.globalAlpha = alpha
    for (let i = 0, x = 12; x < v.width - 12; i++, x += spacing * (0.6 + hash(i + 3) * 0.8)) {
      const coral = CORALS[Math.floor(hash(i + 7) * CORALS.length)]
      const rows = coral.sprite.length
      ctx.fillStyle = coral.color
      coral.sprite.forEach((row, ry) => {
        // Sway: the top leans with the current, the base stays planted.
        const lean = Math.round(Math.sin(v.t / 1100 + i) * ((rows - ry) / rows) * 1.2)
        for (let rx = 0; rx < row.length; rx++) {
          if (row[rx] === '.') continue
          ctx.fillRect(
            Math.round(x / cell) * cell + (rx + lean) * cell,
            Math.round(floorY / cell) * cell - (rows - ry + 1) * cell,
            cell,
            cell,
          )
        }
      })
    }
  }

  return {
    draw(v: OceanView) {
      v.ctx.save()
      v.ctx.fillStyle = v.tokens.muted
      drawMantas(v)
      drawShark(v)
      drawSchool(v)
      drawDarters(v)
      drawSeafloor(v)
      v.ctx.restore()
    },
  }
}
