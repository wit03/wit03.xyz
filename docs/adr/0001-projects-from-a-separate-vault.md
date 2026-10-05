# Projects come from a separate private Vault, pulled at build

Project notes are written in Obsidian, in a private repo (`wit03/projects-vault`). The site pulls it at build time and reads only Published notes: those in the `Projects/` folder with `publish: true`. Images travel the same way: they live in the Vault's attachments, and only images referenced by Published notes are copied in, resized, converted to WebP and stripped of metadata. A push to the Vault triggers a rebuild through a Vercel deploy hook. We chose this over keeping the notes in this public repo so the Vault can hold drafts and private notes without anything leaking.

## Considered Options

- **Notes inside this repo**: simplest, but the site repo is public, so every draft would be public too.
- **Images in object storage (R2 / Vercel Blob)**: keeps the Vault small, but an uploaded image is public by URL even in a draft, and the Obsidian workflow then depends on an upload plugin. Revisit if the Vault grows past about 1 GB.
- **Git LFS for images**: Obsidian Git's LFS support is unreliable, especially on mobile.

## Consequences

- Vercel needs a read-only token for the Vault, and the Vault needs the deploy hook.
- Local development and previews without Vault access fall back to sample Projects kept in this repo.
- A broken Published note fails the build, so the live site keeps its last good version.
