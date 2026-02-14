import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
const envExample = path.join(cwd, '.env.example');
const envFile = path.join(cwd, '.env');

const ensureFile = () => {
  if (!fs.existsSync(envFile)) {
    if (!fs.existsSync(envExample)) {
      process.exit(1);
    }
    const tpl = fs.readFileSync(envExample, 'utf-8');
    fs.writeFileSync(envFile, tpl);
  }
};

const readEnv = () => {
  const text = fs.readFileSync(envFile, 'utf-8');
  const lines = text.split(/\r?\n/);
  const map = new Map();
  for (const l of lines) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) map.set(m[1], m[2]);
  }
  return { lines, map };
};

const setIfMissing = (env, key, value) => {
  if (!env.map.has(key)) {
    env.lines.push(`${key}=${value}`);
    env.map.set(key, value);
  }
};

ensureFile();
const env = readEnv();

const brandName = path.basename(cwd);
setIfMissing(env, 'VITE_BRAND_NAME', brandName);
setIfMissing(env, 'VITE_BASE_URL', 'http://localhost:4173');
setIfMissing(env, 'VITE_DEFAULT_DESCRIPTION', 'Aprenda com ebooks exclusivos. Receitas e técnicas profissionais para transformar sua paixão em negócio.');
setIfMissing(env, 'VITE_SOCIAL_IMAGE', '/og-image.jpg');
setIfMissing(env, 'VITE_PWA_DESCRIPTION', 'Aprenda com ebooks exclusivos. Receitas e técnicas profissionais.');

fs.writeFileSync(envFile, env.lines.join('\n'));

const missing = [];
for (const k of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY']) {
  if (!env.map.get(k)) missing.push(k);
}
if (missing.length) {
  console.log('Defina variáveis no .env:', missing.join(', '));
}
console.log('Whitelabel inicializado com sucesso');