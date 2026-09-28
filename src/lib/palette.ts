// Fixed colours for places CSS variables can't reach: the generated favicon/OG image, the
// browser theme colour, and the canvas-drawn sky and sea. Keep the page colours in sync with
// the tokens at the top of globals.css.

export const PALETTE = { bg: '#0b0e12', ink: '#e6eaee', muted: '#8c96a1', accent: '#8196ff' } as const

export const OCEAN = {
  /** Sky gradients, top of the band down to the horizon. */
  sky: {
    night: ['#070b1f', '#131d45', '#23336a'],
    dawn: ['#2c3a78', '#8a6fa8', '#f2a88a'],
    day: ['#5aaee8', '#8ccaf2', '#d3ecfa'],
    golden: ['#4f8fd0', '#f0b877', '#f7d69a'],
    dusk: ['#1f2459', '#7a4a86', '#ef7f5c'],
  },
  /** Sunlit water just under the waterline; it darkens into the page's deep water below. */
  sea: {
    night: '#12204a',
    dawn: '#2a4274',
    day: '#2378b4',
    golden: '#2c6a94',
    dusk: '#2a3163',
  },
  sun: { core: '#fff3c4', dawn: '#ff9a62', day: '#ffd766', golden: '#ffb347', dusk: '#ff8a5c' },
  moon: { lit: '#f4f1e2', dark: 'rgba(244,241,226,.12)' },
  star: '#ffffff',
  waterline: '#9fc4ff',
  eye: 'rgba(255,255,255,.7)',
  sand: '#cbbd98',
  coral: { branch: '#d4a0aa', fan: '#d6ae88', brain: '#aa9ac6', kelp: '#88b79b' },
} as const
