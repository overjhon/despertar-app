import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const cwd = process.cwd()
const access = process.env.SUPABASE_ACCESS_TOKEN
const fnDir = path.join(cwd, 'supabase', 'functions', 'handle-purchase')
if (!access) {
  console.log('SUPABASE_ACCESS_TOKEN ausente, pulando deploy')
  process.exit(0)
}
if (!fs.existsSync(fnDir)) {
  console.log('Função handle-purchase ausente, pulando deploy')
  process.exit(0)
}
try {
  execSync('supabase functions deploy handle-purchase', { stdio: 'inherit' })
  console.log('DEPLOY_FUNCTIONS_OK')
} catch (e) {
  console.log('DEPLOY_FUNCTIONS_FAIL')
}