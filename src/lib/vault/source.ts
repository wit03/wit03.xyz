import fs from 'node:fs'
import path from 'node:path'
import { readVault, type Vault } from './index'

// Where the site's Projects come from, in order (docs/adr/0001):
// 1. a local Vault folder named by VAULT_PATH, when set explicitly (writing with instant updates;
//    it wins so a leftover build clone never shadows the Vault you're editing),
// 2. the Vault cloned into .vault/ by `scripts/fetch-vault.mjs` at build time (Vercel),
// 3. the sample Vault in this repo, so builds without secrets still work.

const CLONED_VAULT = path.join(process.cwd(), '.vault')
const SAMPLE_VAULT = path.join(process.cwd(), 'content', 'sample-vault')

function vaultDir() {
  if (process.env.VAULT_PATH) return path.resolve(process.env.VAULT_PATH)
  if (fs.existsSync(CLONED_VAULT)) return CLONED_VAULT
  return SAMPLE_VAULT
}

let cached: Vault | undefined

export function getVault(): Vault {
  // Re-read on every call in dev so edits in Obsidian show up on refresh.
  if (cached && process.env.NODE_ENV === 'production') return cached
  const vault = readVault(vaultDir())
  if (!cached) for (const w of vault.warnings) console.warn(`[vault] ${w}`)
  cached = vault
  return vault
}

export function getProject(slug: string) {
  return getVault().projects.find((p) => p.slug === slug)
}
