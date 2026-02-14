import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

const env = process.env
const src = env.SOURCE_REF
const tgt = env.TARGET_REF
const token = env.SUPABASE_ACCESS_TOKEN
const tgtUrl = env.TARGET_URL
const tgtSvc = env.TARGET_SERVICE_ROLE_KEY
const webhook = env.KIWIFY_WEBHOOK_SECRET
const fcm = env.FIREBASE_SERVER_KEY

if (!src || !tgt) { console.error('SOURCE_REF e TARGET_REF são obrigatórios'); process.exit(1) }
const root = path.resolve(path.join(process.cwd(), '..'))
const run = (cmd, cwd = root) => execSync(cmd, { stdio: 'inherit', cwd })

if (token) run(`supabase login --token "${token}"`)

run(`supabase link --project-ref ${src}`)
run(`supabase db pull`)

run(`supabase link --project-ref ${tgt}`)
run(`supabase db push`)

if (tgtUrl && tgtSvc) run(`supabase functions secrets set SUPABASE_URL=${tgtUrl} --project-ref ${tgt}`)
if (tgtSvc) run(`supabase functions secrets set SUPABASE_SERVICE_ROLE_KEY=${tgtSvc} --project-ref ${tgt}`)
if (webhook) run(`supabase functions secrets set KIWIFY_WEBHOOK_SECRET=${webhook} --project-ref ${tgt}`)
if (fcm) run(`supabase functions secrets set FIREBASE_SERVER_KEY=${fcm} --project-ref ${tgt}`)

const fns = [
  'handle-purchase',
  'claim-purchases',
  'moderate-content',
  'process-referral',
  'process-referral-reward',
  'seed-database',
  'send-push',
  'send-test-webhook'
]
for (const fn of fns) run(`supabase functions deploy ${fn} --project-ref ${tgt}`)

console.log('REPLICATE_ALL_OK')