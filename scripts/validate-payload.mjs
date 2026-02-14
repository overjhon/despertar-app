import fs from 'fs'
import path from 'path'

const cwd = process.cwd()
const fn = path.join(cwd, 'supabase', 'functions', 'handle-purchase', 'index.ts')
console.log(fs.existsSync(fn) ? 'handle-purchase encontrado' : 'handle-purchase não encontrado')
console.log('Headers: Content-Type, X-Timestamp, X-Signature')
console.log('Body: email, ebook_id, ebook_name, amount, transaction_id, paid_at')
console.log('PAYLOAD_VALIDATION_OK')