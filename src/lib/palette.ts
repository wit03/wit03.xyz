// Fixed colours for places CSS variables can't reach: the generated favicon/OG image and
// the browser theme colour. Keep in sync with the tokens at the top of globals.css.

export const PALETTE = {
  light: { bg: '#f1f3f4', ink: '#101418', muted: '#5b6570', accent: '#2f4fe0' },
  dark: { bg: '#0b0e12' },
} as const
