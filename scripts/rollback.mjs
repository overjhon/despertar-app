import fs from 'fs'
import path from 'path'

const cwd = process.cwd()
const backupRoot = path.join(cwd, '.backup')
if (!fs.existsSync(backupRoot)) {
  console.log('Nenhum backup encontrado')
  process.exit(0)
}
const entries = fs.readdirSync(backupRoot)
if (!entries.length) {
  console.log('Nenhum backup encontrado')
  process.exit(0)
}
entries.sort()
const latest = path.join(backupRoot, entries[entries.length - 1])
const cp = (from, to) => { fs.cpSync(from, to, { recursive: true, force: true }) }

const copyBack = p => {
  const src = path.join(latest, p)
  if (fs.existsSync(src)) cp(src, path.join(cwd, p))
}

for (const p of ['src', 'public', 'supabase', 'vite.config.ts', 'tailwind.config.ts', 'index.html', 'vercel.json']) copyBack(p)
console.log(`ROLLBACK_OK ${path.basename(latest)}`)