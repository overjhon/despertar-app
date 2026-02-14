# 📖 Guia de Setup Completo - Plataforma Whitelabel

Este guia vai te levar do zero ao app funcionando em produção em ~40 minutos.

---

## ⚡ SETUP RÁPIDO (5-10 minutos)

**NOVO!** Agora você pode configurar TUDO em apenas 5-10 minutos usando 8 prompts certeiros:

👉 **[PROMPTS_SETUP.md](./PROMPTS_SETUP.md)** - Setup automático do zero absoluto

Este novo método:
- ✅ **95% automatizado** (apenas copiar e colar)
- ✅ **Validado em cada etapa** (sabe se algo deu errado)
- ✅ **5-10 minutos** vs 40 minutos do método manual abaixo

**Recomendado para:** Quem acabou de fazer remix e quer começar RÁPIDO.

---

## 📚 Setup Manual Completo (método tradicional)

Se preferir entender cada passo em detalhes, siga o guia manual abaixo:

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:

- [ ] Conta no Lovable (gratuita) - [lovable.dev](https://lovable.dev)
- [ ] Conta no Supabase (gratuita) - [supabase.com](https://supabase.com)
- [ ] Email para ser admin do sistema
- [ ] *(Opcional)* Conta Firebase para push notifications

⏱️ **Tempo total estimado**: ~40 minutos

---

## 🗄️ PASSO 1: Criar Projeto Supabase (3 min)

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em **"New Project"**
4. Preencha:
   - **Organization**: Escolha ou crie uma
   - **Name**: Use o mesmo nome do Lovable
   - **Database Password**: **⚠️ ANOTE ESSA SENHA!**
   - **Region**: `South America (São Paulo)` (mais próximo do Brasil)
   - **Pricing Plan**: Free (suficiente para começar)
5. Clique em **"Create new project"**
6. ⏱️ Aguarde ~2 minutos (o projeto está sendo provisionado)
7. ✅ **Projeto Supabase criado!**

---

## 📊 PASSO 3: Criar Banco de Dados (5 min)

### 3.1 Abrir SQL Editor

1. No Supabase, clique em **"SQL Editor"** no menu lateral
2. Clique em **"New Query"** (ou pressione `Ctrl+Enter`)

### 3.2 Executar SQL Completo

1. Abra o arquivo [`docs/DATABASE_COMPLETE.sql`](./DATABASE_COMPLETE.sql)
2. Copie **TODO** o conteúdo (Ctrl+A, depois Ctrl+C)
3. Cole no SQL Editor do Supabase
4. Clique em **"RUN"** (ou pressione F5)
5. ⏱️ Aguarde ~30 segundos
6. Você verá: **"Success. No rows returned"**
7. ✅ **Banco de dados criado com sucesso!**

### 3.3 Verificar Criação

1. Vá em **"Table Editor"** no menu lateral
2. Você deve ver **~30 tabelas** criadas:
   - `profiles`
   - `ebooks`
   - `user_gamification`
   - `badges`
   - `challenges`
   - `community_posts`
   - `testimonials`
   - `licenses`
   - ... e muitas outras

✅ **Se você vê as tabelas, está tudo certo!**

---

## 📦 PASSO 4: Criar Storage Buckets (3 min)

⚠️ **IMPORTANTE**: Os buckets **NÃO PODEM** ser criados via SQL. Você precisa criá-los manualmente.

Siga o guia detalhado: [STORAGE_SETUP.md](./STORAGE_SETUP.md)

**Resumo rápido**:

1. Vá em **"Storage"** no Supabase
2. Crie 5 buckets (todos **públicos**):

| Bucket | Tamanho Max | Tipos Permitidos |
|--------|-------------|------------------|
| `avatars` | 5 MB | image/* |
| `covers` | 20 MB | image/* |
| `samples` | 50 MB | application/pdf |
| `ebooks` | 100 MB | application/pdf |
| `community-media` | 10 MB | image/*, video/* |

✅ **Após criar os 5 buckets, prossiga**

---

## ⚡ PASSO 5: Criar Edge Functions (10 min)

As Edge Functions são o "backend" da plataforma. Você precisa criar 8 funções.

Siga o guia detalhado: [EDGE_FUNCTIONS_SETUP.md](./EDGE_FUNCTIONS_SETUP.md)

**Resumo rápido**:

1. Vá em **"Edge Functions"** no Supabase
2. Para cada função abaixo:
   - Clique em **"Create Function"**
   - Cole o nome
   - Cole o código (ver guia completo)
   - Clique em **"Deploy"**

**Funções obrigatórias** (copie os códigos do guia):

- ✅ `handle-purchase` - Recebe webhooks de compra
- ✅ `claim-purchases` - Usuário resgata compras
- ✅ `moderate-content` - Moderação com IA
- ✅ `process-referral` - Sistema de indicações
- ✅ `seed-database` - Popular dados de teste

**Funções opcionais**:

- `process-referral-reward` - Recompensas de indicação
- `send-push` - Notificações push
- `send-test-webhook` - Testar webhooks

⏱️ Cada função leva ~1-2 minutos para criar e fazer deploy.

✅ **Após criar as funções obrigatórias, prossiga**

---

## 🔐 PASSO 6: Configurar Secrets (2 min)

Secrets são variáveis de ambiente seguras para API keys.

### 6.1 Acessar Secrets

1. No Supabase, vá em **"Project Settings"** (⚙️ canto inferior esquerdo)
2. Clique em **"Edge Functions"**
3. Role até **"Secrets"**

### 6.2 Adicionar Secrets

**Obrigatório**:

| Nome | Onde obter | Para que serve |
|------|------------|----------------|
| `LOVABLE_API_KEY` | [lovable.dev/settings](https://lovable.dev/settings) | Moderação com IA (gratuito) |

**Opcional** (pode adicionar depois):

| Nome | Onde obter | Para que serve |
|------|------------|----------------|
| `FIREBASE_SERVER_KEY` | Firebase console | Notificações push |

### 6.3 Como Adicionar um Secret

1. Clique em **"Add new secret"**
2. **Name**: `LOVABLE_API_KEY`
3. **Value**: Cole sua API key do Lovable
4. Clique em **"Add secret"**

✅ **Secret `LOVABLE_API_KEY` configurado**

---

## 🔗 PASSO 7: Conectar Supabase no Lovable (2 min)

Agora vamos conectar seu projeto Lovable ao Supabase.

### 7.1 Obter Credenciais do Supabase

1. No Supabase, vá em **"Project Settings"** → **"API"**
2. Anote (ou copie):
   - **Project URL**: `https://[seu-projeto].supabase.co`
   - **anon public** key: `eyJhbG...` (key pública)
   - **service_role** key: `eyJhbG...` (⚠️ **NÃO COMPARTILHE!**)

### 7.2 Conectar no Lovable

1. No Lovable, abra seu projeto
2. Vá em **"Settings"** → **"Integrations"**
3. Clique em **"Add Integration"** → **"Supabase"**
4. Cole as 3 credenciais:
   - Project URL
   - Anon key
   - Service role key
5. Clique em **"Connect"**
6. ⏱️ Aguarde ~10 segundos (sincronizando tipos)
7. ✅ **Supabase conectado!**

Você verá uma mensagem: **"Connected to Supabase"**

---

## 👤 PASSO 8: Configurar Primeiro Admin (1 min)

Você precisa de um usuário admin para acessar o painel de administração.

### Opção A: Atribuir Admin Manualmente (Recomendado)

1. **Cadastre-se no app** com seu email (acesse o preview no Lovable)
2. No Supabase, vá em **"SQL Editor"**
3. Execute este SQL (substitua `SEU_EMAIL`):

```sql
-- Substituir SEU_EMAIL pelo email que você cadastrou
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'seu@email.com';
```

4. Clique em **"RUN"**
5. ✅ **Você é admin agora!**

### Opção B: Admin Automático

Se você cadastrar com o email `admin@example.com`, o sistema **automaticamente** te dá role de admin (configurado na função `assign_admin_role`).

**Para customizar**:

1. Abra `docs/DATABASE_COMPLETE.sql`
2. Localize a função `assign_admin_role()`
3. Troque `admin@example.com` pelo seu email desejado
4. Execute o SQL novamente

---

## 🎲 PASSO 9: Popular Dados Iniciais (1 min)

Vamos adicionar dados de exemplo para testar.

### Opção A: Usar Edge Function (Recomendado)

1. Faça login no app como admin
2. Acesse `/admin` (painel de administração)
3. Procure por **"Seed Database"** ou execute via SQL Editor:

```sql
-- Chamar a edge function seed-database
SELECT extensions.http((
  'POST',
  'https://[seu-projeto].supabase.co/functions/v1/seed-database',
  ARRAY[
    extensions.http_header('Authorization', 'Bearer ' || current_setting('request.jwt.claim.sub')),
    extensions.http_header('Content-Type', 'application/json')
  ],
  'application/json',
  '{"userCount": 30, "cleanOldData": false}'
)::extensions.http_request);
```

4. Aguarde ~30 segundos
5. ✅ **Dados populados:**
   - 30 usuários de teste
   - Posts na comunidade
   - Depoimentos
   - Criações
   - Estatísticas de leitura

### Opção B: Adicionar Manualmente

1. Acesse `/admin/ebooks`
2. Clique em **"Novo Ebook"**
3. Preencha os dados e faça upload do PDF
4. Repita para adicionar mais ebooks

---

## 🎨 PASSO 10: Personalizar Branding (5 min)

Agora vamos personalizar o app com sua marca.

### 10.1 Editar Variáveis de Ambiente

1. No Lovable, abra o arquivo `.env.example`
2. Crie um arquivo `.env` (se não existir)
3. Edite as variáveis:

```env
# Informações da Marca
VITE_BRAND_NAME="Seu App"
VITE_DEFAULT_DESCRIPTION="Descrição do seu app"
VITE_BASE_URL=https://seu-app.lovable.app
VITE_SOCIAL_IMAGE=/og-image.jpg
VITE_PWA_DESCRIPTION="Aprenda com ebooks exclusivos"
```

### 10.2 Substituir Imagens

Substitua estes arquivos em `public/`:

| Arquivo | Tamanho | Descrição |
|---------|---------|-----------|
| `og-image.jpg` | 1200x630px | Imagem de compartilhamento social |
| `favicon.ico` | 32x32px | Ícone do navegador |
| *(opcional)* `logo.png` | 512x512px | Logo da sua marca |

### 10.3 Personalizar Cores (Opcional)

Edite `src/index.css` para mudar as cores principais:

```css
:root {
  --primary: [sua cor HSL];
  --secondary: [sua cor HSL];
  /* etc */
}
```

Ver guia completo: [CUSTOMIZATION.md](./CUSTOMIZATION.md)

✅ **App personalizado com sua marca!**

---

## ✅ PASSO 11: Testar Tudo (5 min)

Agora vamos verificar se está tudo funcionando.

### 11.1 Teste de Autenticação

- [ ] Criar nova conta funciona
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Editar perfil funciona

### 11.2 Teste de Ebooks

- [ ] Ver lista de ebooks
- [ ] Abrir visualizador de PDF
- [ ] Progresso de leitura salva
- [ ] Navegação por capítulos funciona

### 11.3 Teste de Gamificação

- [ ] XP é concedido ao ler
- [ ] Badges aparecem quando conquistados
- [ ] Leaderboard carrega
- [ ] Perfil mostra nível correto

### 11.4 Teste de Comunidade

- [ ] Criar post
- [ ] Curtir post
- [ ] Comentar em post
- [ ] Ver feed da comunidade

### 11.5 Teste de Admin

- [ ] Acessar `/admin`
- [ ] Ver dashboard com estatísticas
- [ ] Adicionar novo ebook
- [ ] Upload de PDF funciona
- [ ] Gerenciar usuários

⚠️ **Se algum teste falhar, veja [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

---

## 🌐 PASSO 12: Publicar! (1 min)

Hora de colocar seu app no ar!

### 12.1 Deploy no Lovable

1. No Lovable, clique em **"Publish"** (canto superior direito)
2. Escolha:
   - **Subdomain**: `seu-app` (será `seu-app.lovable.app`)
   - **Environment**: Production
3. Clique em **"Publish Now"**
4. ⏱️ Aguarde ~2 minutos (build + deploy)
5. ✅ **Seu app está no ar!**

URL final: `https://seu-app.lovable.app`

### 12.2 Conectar Domínio Customizado (Opcional)

Se você tem um domínio próprio:

1. No Lovable, vá em **"Settings"** → **"Domains"**
2. Clique em **"Add custom domain"**
3. Digite seu domínio: `seu-site.com`
4. Configure os DNS records (instruções na tela)
5. Aguarde propagação DNS (~5-30 minutos)
6. ✅ **Seu app está em `https://seu-site.com`!**

---

## 🎉 Pronto!

**Parabéns!** 🎊 Você tem agora:

- ✅ App completo funcionando
- ✅ Banco de dados próprio (Supabase)
- ✅ Edge functions rodando
- ✅ Sistema de admin configurado
- ✅ Gamificação ativa
- ✅ Comunidade funcionando
- ✅ App publicado na web

---

## 🚀 Próximos Passos

Agora você pode:

### Imediato

1. [ ] Adicionar seus ebooks
2. [ ] Customizar cores e logos
3. [ ] Convidar primeiros usuários
4. [ ] Testar sistema de compras

### Curto Prazo

1. [ ] Configurar webhooks de pagamento (Kiwify/Hotmart)
2. [ ] Criar primeira licença whitelabel
3. [ ] Configurar Google Analytics (opcional)
4. [ ] Habilitar notificações push (opcional)
5. [ ] Conectar domínio customizado

### Médio Prazo

1. [ ] Criar desafios personalizados
2. [ ] Adicionar badges customizados
3. [ ] Configurar programa de indicações
4. [ ] Lançar primeira campanha de marketing

---

## 📚 Documentação Adicional

- [CUSTOMIZATION.md](./CUSTOMIZATION.md) - Personalizações avançadas
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura técnica
- [FAQ.md](./FAQ.md) - Perguntas frequentes
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Resolver problemas
- [EDGE_FUNCTIONS_SETUP.md](./EDGE_FUNCTIONS_SETUP.md) - Edge Functions completas

---

## ⚠️ Troubleshooting Rápido

### Erro: "relation does not exist"
- Você não executou o SQL completo
- Solução: Execute `DATABASE_COMPLETE.sql` novamente

### Erro: Edge function failed
- Você não configurou os secrets
- Solução: Configure `LOVABLE_API_KEY` no Supabase

### Erro: Não consigo fazer upload
- Você não criou os storage buckets
- Solução: Siga [STORAGE_SETUP.md](./STORAGE_SETUP.md)

### Erro: "Invalid license"
- Se não usar licenciamento, desabilite a validação
- Ou crie uma licença dummy para testes

Ver lista completa: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 🆘 Precisa de Ajuda?

1. Verifique [FAQ.md](./FAQ.md)
2. Leia [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. Abra uma issue no GitHub
4. Entre em contato: support@example.com

---

**Sucesso no seu projeto!** 🚀
