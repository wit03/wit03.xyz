# wit03.xyz

Personal site of Jarukit Jintanasathirakul (wit03). Next.js App Router, Tailwind v4, deployed on Vercel.

## Updating content

Every word on the page lives in [`content/`](content). Edit a file, commit, and Vercel rebuilds.

| File              | What it holds                                                     |
| ----------------- | ----------------------------------------------------------------- |
| `site.md`         | Handle, name, tagline, status line, email, links, optional résumé |
| `sections.md`     | Section order, titles and dive depth (remove a line to hide one)  |
| `now.md`          | The "Now" bullets                                                 |
| `experience/*.md` | One file per job; the body is the bullet list                     |
| `education/*.md`  | One file per school                                               |
| `projects/*.md`   | One file per project; `order` sets the position                   |
| `talks.md`        | Talks (add `url:` to link one)                                    |
| `writing.md`      | Articles hosted elsewhere (add `url:` to link out)                |
| `awards.md`       | Awards                                                            |
| `offscreen.md`    | Hobbies and community                                             |

A new job looks like this. Leave out `end` for a current role; the "Current" badge and the duration are worked out from the dates.

```md
---
role: AI Engineer
company: Skooldio
companyUrl: https://www.skooldio.com
type: Internship → Contract
start: 2025-06
end: 2026-05
---

- Built **Pegasus**, the customer-support chatbot platform for LINE MAN Wongnai.
```

Frontmatter is validated with Zod in [`src/lib/content.ts`](src/lib/content.ts). A typo fails the build and names the file and field.

## Development

```sh
pnpm install
pnpm dev        # http://localhost:3000
pnpm check      # typecheck + lint + production build
pnpm format     # prettier
```

## How the page works

- `src/components/Avatar.tsx`: the pixel avatar (blinks, follows the cursor, dives on click). The sprite itself is in `src/lib/sprite.ts` and is reused for the favicon and OG image.
- `src/components/DiveLayer.tsx`: the parallax ocean, pinned depth gauge and dive-computer readout. Scroll depth is interpolated between each section's `depth` in `sections.md`.
- `src/components/Hero.tsx`: intro dissolve, cursor trail and hero drift.
- All motion is disabled under `prefers-reduced-motion`.
