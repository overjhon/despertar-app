import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const cwd = process.cwd()
const ts = new Date().toISOString().replace(/[:.]/g, '-')
const importDir = path.join(cwd, '.import')
const backupDir = path.join(cwd, '.backup', ts)
const repoUrl = 'https://github.com/magoautomacoes/read-flow-46.git'
const cloneDir = path.join(importDir, `read-flow-46-${ts}`)
const dirs = ['src', 'public', 'supabase']
const files = ['vite.config.ts', 'tailwind.config.ts', 'index.html', 'vercel.json']

const ensureDir = p => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }) }
const cp = (from, to) => { fs.cpSync(from, to, { recursive: true, force: true }) }

ensureDir(importDir)
ensureDir(backupDir)

execSync(`git clone --depth 1 ${repoUrl} "${cloneDir}"`, { stdio: 'ignore' })

for (const d of dirs) {
  const src = path.join(cwd, d)
  if (fs.existsSync(src)) cp(src, path.join(backupDir, d))
}
for (const f of files) {
  const src = path.join(cwd, f)
  if (fs.existsSync(src)) {
    ensureDir(path.dirname(path.join(backupDir, f)))
    cp(src, path.join(backupDir, f))
  }
}

for (const d of dirs) {
  const from = path.join(cloneDir, d)
  if (fs.existsSync(from)) cp(from, path.join(cwd, d))
}
for (const f of files) {
  const from = path.join(cloneDir, f)
  if (fs.existsSync(from)) cp(from, path.join(cwd, f))
}

console.log(`IMPORT_OK ${ts}`)