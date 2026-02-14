import fs from 'fs'
import path from 'path'

const cwd = process.cwd()
const importRoot = path.join(cwd, '.import')
const dirs = fs.existsSync(importRoot) ? fs.readdirSync(importRoot).filter(d => d.startsWith('read-flow-46-')) : []
if (!dirs.length) {
  console.log('Nenhum projeto importado encontrado em .import')
  process.exit(0)
}
dirs.sort()
const srcPkgPath = path.join(importRoot, dirs[dirs.length - 1], 'package.json')
const tgtPkgPath = path.join(cwd, 'package.json')
if (!fs.existsSync(srcPkgPath) || !fs.existsSync(tgtPkgPath)) {
  console.log('package.json fonte ou destino ausente')
  process.exit(0)
}
const src = JSON.parse(fs.readFileSync(srcPkgPath, 'utf-8'))
const tgt = JSON.parse(fs.readFileSync(tgtPkgPath, 'utf-8'))

const addMissing = (from, to) => {
  let added = 0
  for (const k of Object.keys(from || {})) {
    if (!to[k]) { to[k] = from[k]; added++ }
  }
  return added
}

if (!tgt.dependencies) tgt.dependencies = {}
if (!tgt.devDependencies) tgt.devDependencies = {}
if (!tgt.overrides) tgt.overrides = {}

const depsAdded = addMissing(src.dependencies, tgt.dependencies)
const devAdded = addMissing(src.devDependencies, tgt.devDependencies)
addMissing(src.overrides, tgt.overrides)

fs.writeFileSync(tgtPkgPath, JSON.stringify(tgt, null, 2))
console.log(`SYNC_DEPS_OK deps:${depsAdded} devDeps:${devAdded}`)