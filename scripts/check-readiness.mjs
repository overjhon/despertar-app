import fs from 'fs'
import path from 'path'

const cwd = process.cwd()
const envFile = path.join(cwd, '.env')
let ok = true
if (!fs.existsSync(path.join(cwd, 'src'))) ok = false
if (!fs.existsSync(path.join(cwd, 'public'))) ok = false
if (!fs.existsSync(envFile)) ok = false
console.log(ok ? 'READY_OK' : 'READY_INCOMPLETE')