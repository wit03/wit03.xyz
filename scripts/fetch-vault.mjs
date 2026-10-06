// Runs before `next build`. With VAULT_TOKEN set, shallow-clones the private Vault into .vault/ so
// the Vault reader can use it (docs/adr/0001). Without a token it does nothing, and the site falls
// back to VAULT_PATH or the sample Vault in content/sample-vault, so builds without secrets work.
//
//   VAULT_TOKEN  fine-grained GitHub token with read-only Contents access to the Vault repo
//   VAULT_REPO   owner/name of the Vault repo (default: wit03/projects-vault)
//   VAULT_REF    branch or tag to build from (default: the repo's default branch)

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const DEST = path.join(process.cwd(), '.vault')
const MARKER = path.join(DEST, '.cloned-by-wit03-xyz')
const { VAULT_TOKEN: token, VAULT_REPO: repo = 'wit03/projects-vault', VAULT_REF: ref } = process.env

// Only ever delete a folder this script created.
if (fs.existsSync(MARKER)) fs.rmSync(DEST, { recursive: true, force: true })
else if (fs.existsSync(DEST)) {
  console.error(`[vault] ${DEST} exists but wasn't created by this script; move it away and retry.`)
  process.exit(1)
}

if (!token) {
  console.log(
    `[vault] No VAULT_TOKEN: using ${process.env.VAULT_PATH ? `VAULT_PATH (${process.env.VAULT_PATH})` : 'the sample Vault'}.`,
  )
  process.exit(0)
}

// The token travels as an HTTP header set through git's environment config, never on the command
// line (where `ps` would show it) and never in the clone's remote URL or .git/config.
const auth = Buffer.from(`x-access-token:${token}`).toString('base64')
try {
  execFileSync(
    'git',
    ['clone', '--quiet', '--depth', '1', ...(ref ? ['--branch', ref] : []), `https://github.com/${repo}.git`, DEST],
    {
      stdio: ['ignore', 'ignore', 'pipe'],
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: '0',
        GIT_CONFIG_COUNT: '1',
        GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
        GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${auth}`,
      },
    },
  )
} catch (err) {
  fs.rmSync(DEST, { recursive: true, force: true }) // don't leave a half-clone behind
  const message = String(err.stderr ?? err.message)
    .replaceAll(token, '***')
    .replaceAll(auth, '***')
  console.error(`[vault] Could not clone ${repo}: ${message.trim()}`)
  console.error('[vault] Failing the build so the live site keeps its last good version.')
  process.exit(1)
}

// Git metadata isn't needed to build; drop it and mark the folder as ours.
fs.rmSync(path.join(DEST, '.git'), { recursive: true, force: true })
fs.writeFileSync(MARKER, `Cloned from ${repo}${ref ? `@${ref}` : ''} at build time. Safe to delete.\n`)
const notes = fs.existsSync(path.join(DEST, 'Projects')) ? fs.readdirSync(path.join(DEST, 'Projects')).length : 0
console.log(`[vault] Cloned ${repo}${ref ? `@${ref}` : ''}: ${notes} entries in Projects/.`)
