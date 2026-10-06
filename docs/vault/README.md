# The Vault

Projects on wit03.xyz are written in Obsidian, in the private repo `wit03/projects-vault`, and pulled at
build time. See `docs/adr/0001-projects-from-a-separate-vault.md` for why, and `CONTEXT.md` for the terms.

## One-time setup

Run the wizard from the repo root. It opens each page, asks for each value and stores it:

```sh
bash scripts/setup-vault.sh
```

It walks through:

1. Creating the private repo `wit03/projects-vault` from `docs/vault/template/`.
2. A fine-grained GitHub token with read-only **Contents** access to that repo only, saved in Vercel as
   `VAULT_TOKEN` (Production and Preview).
3. A Vercel deploy hook for the production branch, saved in the Vault repo as the `VERCEL_DEPLOY_HOOK`
   secret. The template's GitHub Action calls it on every push.
4. Obsidian Git, so the Vault pushes on its own.

## Writing

- One note per Project in `Projects/`. Only notes with `publish: true` reach the site.
- Frontmatter: `name`, `summary`, `status` (building / paused / shipped / archived), `started` (YYYY-MM),
  `tags`, `links`, and optionally `slug` and `cover`. See `template/Projects/Example project.md`.
- Text before the first `## YYYY-MM-DD Title` heading is the intro; each such heading is a Journey entry.
- `[[Other project]]` links work when the other note is published; anything else shows as plain text.
- Images live anywhere in the Vault (Obsidian's attachments folder is fine). Only images referenced by
  published notes are copied to the site, resized to WebP with all metadata (GPS included) stripped.
- A broken published note (missing name, unknown status, bad date heading, duplicate slug) fails the
  build, so the live site keeps its last good version. The Vercel build log names the note.

## Local development

```sh
VAULT_PATH=~/path/to/projects-vault pnpm dev
```

Without `VAULT_PATH` (and without `VAULT_TOKEN`), the site uses the sample Vault in `content/sample-vault/`.
