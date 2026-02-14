import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const cwd = process.cwd()
const importDir = path.join(cwd, '.import')
const repo = 'magoautomacoes/read-flow-46'
const ts = new Date().toISOString().replace(/[:.]/g, '-')
const cloneDir = path.join(importDir, `read-flow-46-${ts}`)
const ensureDir = p => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }) }
const cp = (from, to) => fs.cpSync(from, to, { recursive: true, force: true })

ensureDir(importDir)

function tryGitClone() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''
  const url = token ? `https://${token}@github.com/${repo}.git` : `https://github.com/${repo}.git`
  execSync(`git clone --depth 1 "${url}" "${cloneDir}"`, { stdio: 'inherit' })
}

async function main() {
  try {
    tryGitClone()

    const dirs = ['src', 'public', 'supabase']
    const files = ['vite.config.ts', 'tailwind.config.ts', 'index.html']
    for (const d of dirs) {
      const from = path.join(cloneDir, d)
      if (fs.existsSync(from)) cp(from, path.join(cwd, d))
    }
    for (const f of files) {
      const from = path.join(cloneDir, f)
      if (fs.existsSync(from)) cp(from, path.join(cwd, f))
    }

    const envExample = path.join(cwd, '.env.example')
    const envFile = path.join(cwd, '.env')
    if (fs.existsSync(envExample) && !fs.existsSync(envFile)) {
      fs.copyFileSync(envExample, envFile)
    }
    console.log(`MVP_BOOTSTRAP_OK ${ts}`)
  } catch (err) {
    console.log('MVP_BOOTSTRAP_FAIL')
    console.log(err && err.message ? err.message : String(err))
    if (process.env.CI) process.exit(0)
    process.exit(1)
  }
}

main()