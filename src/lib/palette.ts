// Fixed colours for places CSS variables can't reach: the generated favicon/OG image, the
// browser theme colour, and the canvas-drawn sky and sea. Keep the page colours in sync with
// the tokens at the top of globals.css.

export const PALETTE = { bg: '#0b0e12', ink: '#e6eaee', muted: '#8c96a1', accent: '#8196ff' } as const

export const OCEAN = {
  /** Sky gradients, top of the band down to the horizon. Daytime skies lean on the site's
   * periwinkle accent rather than a generic sky blue, so the surface still feels like the site. */
  sky: {
    night: ['#070b1f', '#131d45', '#23336a'],
    dawn: ['#2c3a78', '#8a6fa8', '#f2a88a'],
    day: ['#5d70e2', '#98a6ff', '#e4e7ff'],
    golden: ['#5563cc', '#b99ad6', '#ffd09c'],
    dusk: ['#1f2459', '#7a4a86', '#ef7f5c'],
  },
  /** Sunlit water just under the waterline; it darkens into the page's deep water below. */
  sea: {
    night: '#12204a',
    dawn: '#2a4274',
    day: '#3a4fc0',
    golden: '#4046a8',
    dusk: '#2a3163',
  },
  sun: { core: '#fff7de', dawn: '#ff9a62', day: '#ffe08a', golden: '#ffb35c', dusk: '#ff8a5c' },
  moon: { lit: '#f4f1e2', dark: 'rgba(244,241,226,.12)' },
  star: '#ffffff',
  waterline: '#b8c4ff',
  foam: '#f2f4ff',
  eye: 'rgba(255,255,255,.7)',
  sand: '#cbbd98',
  coral: { branch: '#d4a0aa', fan: '#d6ae88', brain: '#aa9ac6', kelp: '#88b79b' },
} as const
