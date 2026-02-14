import fs from 'fs'
import path from 'path'

const cwd = process.cwd()
const importedRoot = path.join(cwd, '.import')
const dirs = fs.existsSync(importedRoot) ? fs.readdirSync(importedRoot).filter(d => d.startsWith('read-flow-46-')) : []
if (!dirs.length) {
  console.log('MVP_SYNC_SKIP no imported project')
  process.exit(0)
}
dirs.sort()
const srcPkgPath = path.join(importedRoot, dirs[dirs.length - 1], 'package.json')
const tgtPkgPath = path.join(cwd, 'package.json')
const src = JSON.parse(fs.readFileSync(srcPkgPath, 'utf-8'))
const tgt = JSON.parse(fs.readFileSync(tgtPkgPath, 'utf-8'))

const merge = (section) => {
  const from = src[section] || {}
  const to = tgt[section] || {}
  let added = 0
  for (const [k, v] of Object.entries(from)) {
    if (!to[k]) { to[k] = v; added++ }
  }
  tgt[section] = to
  return added
}

merge('overrides')
const deps = merge('dependencies')
const devDeps = merge('devDependencies')
fs.writeFileSync(tgtPkgPath, JSON.stringify(tgt, null, 2))
console.log(`MVP_SYNC_OK deps:${deps} devDeps:${devDeps}`)