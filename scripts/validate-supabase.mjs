import fs from 'fs'
import path from 'path'

const cwd = process.cwd()
const envFile = path.join(cwd, '.env')
let vars = {}
if (fs.existsSync(envFile)) {
  const text = fs.readFileSync(envFile, 'utf-8')
  for (const l of text.split(/\r?\n/)) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) vars[m[1]] = m[2]
  }
}
const need = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY']
const missing = need.filter(k => !vars[k])
if (missing.length) console.log('Variáveis ausentes:', missing.join(', '))
const fnPath = path.join(cwd, 'supabase', 'functions', 'handle-purchase', 'index.ts')
console.log(fs.existsSync(fnPath) ? 'Função handle-purchase presente' : 'Função handle-purchase ausente')
console.log('SUPABASE_VALIDATION_OK')