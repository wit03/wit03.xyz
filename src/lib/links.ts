// Off-site links open in a new tab; in-page anchors and mailto: links don't.
export const external = { target: '_blank', rel: 'noopener noreferrer' } as const

export const linkProps = (href: string) => (href.startsWith('http') ? external : {})
