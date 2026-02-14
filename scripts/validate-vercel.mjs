import fs from 'fs'
import path from 'path'

const cwd = process.cwd()
const p = path.join(cwd, 'vercel.json')
let cfg = {}
let changed = false
if (fs.existsSync(p)) cfg = JSON.parse(fs.readFileSync(p, 'utf-8'))
if (!cfg.buildCommand) { cfg.buildCommand = 'npm run build'; changed = true }
if (!cfg.outputDirectory) { cfg.outputDirectory = 'dist'; changed = true }
if (!cfg.rewrites) { cfg.rewrites = [{ source: '/(.*)', destination: '/index.html' }]; changed = true }
if (Array.isArray(cfg.rewrites)) {
  const hasSpa = cfg.rewrites.some(r => r.destination === '/index.html')
  if (!hasSpa) { cfg.rewrites.push({ source: '/(.*)', destination: '/index.html' }); changed = true }
}
if (changed) fs.writeFileSync(p, JSON.stringify(cfg, null, 2))
console.log('VERCEL_VALIDATION_OK')