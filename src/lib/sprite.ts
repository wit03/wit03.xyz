// The pixel avatar, shared by the live canvas, the favicon and the OG image.
// One character per pixel: h hair, s skin, d skin shade, w eye white, m mouth, t shirt.

export const SPRITE = [
  '................',
  '.....hhhhhh.....',
  '...hhhhhhhhhh...',
  '..hhhhhhhhhhhh..',
  '..hhhhhhhhhhhh..',
  '..hhsshhhsshhh..',
  '..hssssssssssh..',
  '.dsswwsssswwssd.',
  '.dsswwsssswwssd.',
  '..ssssssssssss..',
  '..sssssddsssss..',
  '..ssssssssssss..',
  '...sssmmmmsss...',
  '....ssssssss....',
  '......ssss......',
  '...tttttttttt...',
  '..tttttttttttt..',
  '..tttttttttttt..',
  '..tttttttttttt..',
  '..tttttttttttt..',
  '..tttttttttttt..',
  '..tttttttttttt..',
]

export const SPRITE_W = 16
export const SPRITE_H = SPRITE.length

export const COLORS: Record<string, string> = {
  h: '#1a1c22',
  s: '#E9B790',
  d: '#C98E66',
  w: '#FFFFFF',
  m: '#A05A45',
}

export const GEAR = {
  frame: '#2a2d35',
  glint: '#EAF3FF',
  suit: '#1d2128',
  reg: '#2b2f36',
  reg2: '#3d434c',
  hose: '#22252b',
}

/** Eye whites are 2×2 at these columns, rows 7–8. */
export const EYES: [number, number][] = [
  [4, 5],
  [10, 11],
]

/** Round glasses: two rings, a bridge and the temples. */
export const GLASSES: [number, number][] = [
  [4, 6],
  [5, 6],
  [4, 9],
  [5, 9],
  [3, 7],
  [3, 8],
  [6, 7],
  [6, 8],
  [10, 6],
  [11, 6],
  [10, 9],
  [11, 9],
  [9, 7],
  [9, 8],
  [12, 7],
  [12, 8],
  [7, 7],
  [8, 7],
  [2, 7],
  [13, 7],
]

/** Frame pixels lit in sequence for the glint sweep, both lenses at once. */
export const GLINT: [number, number][][] = [
  [
    [3, 8],
    [9, 8],
  ],
  [
    [3, 7],
    [9, 7],
  ],
  [
    [4, 6],
    [10, 6],
  ],
  [
    [5, 6],
    [11, 6],
  ],
]

/** Static pixels for the resting avatar (glasses on, looking ahead). */
export function restingPixels(shirt: string) {
  const px: { x: number; y: number; c: string }[] = []
  SPRITE.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      if (ch !== '.') px.push({ x, y, c: ch === 't' ? shirt : COLORS[ch] })
    }
  })
  // Pupils on the inner column of each eye, so the resting avatar looks at the viewer.
  for (const x of [EYES[0][1], EYES[1][0]]) {
    px.push({ x, y: 7, c: COLORS.h }, { x, y: 8, c: COLORS.h })
  }
  for (const [x, y] of GLASSES) px.push({ x, y, c: GEAR.frame })
  return px
}
