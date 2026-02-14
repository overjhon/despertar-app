# 📦 Guia de Setup de Storage Buckets

## ⚠️ IMPORTANTE

Os buckets de storage **NÃO PODEM** ser criados via SQL Editor.  
Você precisa criá-los manualmente pela interface do Supabase.

---

## 📋 Buckets Necessários

Você precisa criar **5 buckets** no total:

| Bucket | Público? | Tamanho Max | Tipos Permitidos | Descrição |
|--------|----------|-------------|------------------|-----------|
| `avatars` | ✅ SIM | 5 MB | image/* | Fotos de perfil dos usuários |
| `covers` | ✅ SIM | 20 MB | image/* | Capas dos ebooks |
| `samples` | ✅ SIM | 50 MB | application/pdf | PDFs de amostra dos ebooks |
| `ebooks` | ✅ SIM | 100 MB | application/pdf | PDFs completos dos ebooks |
| `community-media` | ✅ SIM | 10 MB | image/*, video/* | Fotos e vídeos da comunidade |

---

## 🛠️ Passo-a-Passo

### 1. Acessar Storage

1. No Supabase, clique em **"Storage"** no menu lateral
2. Você verá uma lista vazia de buckets

---

### 2. Criar Bucket: `avatars`

1. Clique em **"New bucket"**
2. Preencha:
   - **Name**: `avatars`
   - **Public bucket**: ✅ **MARQUE** esta opção
   - **File size limit**: `5242880` (5 MB em bytes)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif`
3. Clique em **"Create bucket"**
4. ✅ Bucket `avatars` criado!

---

### 3. Criar Bucket: `covers`

1. Clique em **"New bucket"**
2. Preencha:
   - **Name**: `covers`
   - **Public bucket**: ✅ **MARQUE** esta opção
   - **File size limit**: `20971520` (20 MB em bytes)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`
3. Clique em **"Create bucket"**
4. ✅ Bucket `covers` criado!

---

### 4. Criar Bucket: `samples`

1. Clique em **"New bucket"**
2. Preencha:
   - **Name**: `samples`
   - **Public bucket**: ✅ **MARQUE** esta opção
   - **File size limit**: `52428800` (50 MB em bytes)
   - **Allowed MIME types**: `application/pdf`
3. Clique em **"Create bucket"**
4. ✅ Bucket `samples` criado!

---

### 5. Criar Bucket: `ebooks`

1. Clique em **"New bucket"**
2. Preencha:
   - **Name**: `ebooks`
   - **Public bucket**: ✅ **MARQUE** esta opção
   - **File size limit**: `104857600` (100 MB em bytes)
   - **Allowed MIME types**: `application/pdf`
3. Clique em **"Create bucket"**
4. ✅ Bucket `ebooks` criado!

---

### 6. Criar Bucket: `community-media`

1. Clique em **"New bucket"**
2. Preencha:
   - **Name**: `community-media`
   - **Public bucket**: ✅ **MARQUE** esta opção
   - **File size limit**: `10485760` (10 MB em bytes)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif, video/mp4, video/webm`
3. Clique em **"Create bucket"**
4. ✅ Bucket `community-media` criado!

---

## ✅ Verificação

Após criar todos os buckets, você deve ver 5 buckets listados:

- ✅ avatars
- ✅ covers
- ✅ samples
- ✅ ebooks
- ✅ community-media

Todos devem ter o ícone 🌐 indicando que são **públicos**.

---

## 🔒 Políticas de Acesso (RLS)

As políticas de acesso já foram criadas automaticamente pelo SQL que você executou. Elas incluem:

### Avatars
- ✅ Qualquer um pode ver
- ✅ Usuários podem fazer upload do próprio avatar
- ✅ Usuários podem atualizar o próprio avatar

### Covers
- ✅ Qualquer um pode ver
- ✅ Admins podem fazer upload
- ✅ Admins podem atualizar

### Samples
- ✅ Qualquer um pode ver
- ✅ Admins podem fazer upload

### Ebooks
- ✅ Qualquer um pode ver (acesso controlado pelo app)
- ✅ Admins podem fazer upload
- ✅ Admins podem atualizar

### Community Media
- ✅ Qualquer um pode ver
- ✅ Usuários autenticados podem fazer upload
- ✅ Usuários podem deletar próprios uploads

---

## ⚠️ Troubleshooting

### Erro: "Bucket already exists"
- Você tentou criar um bucket com nome duplicado
- Escolha outro nome ou delete o bucket existente primeiro

### Erro: "File too large"
- O arquivo excede o limite do bucket
- Aumente o limite em "Storage" → [nome do bucket] → "Settings"

### Uploads não funcionam
- Verifique se o bucket é **público** (ícone 🌐)
- Verifique se executou o SQL completo (inclui políticas RLS)
- Verifique os tipos MIME permitidos

### Não consigo ver arquivos
- Verifique se o bucket é público
- Verifique se as RLS policies foram criadas corretamente
- Teste acessando diretamente a URL: `https://[seu-projeto].supabase.co/storage/v1/object/public/[bucket]/[file]`

---

## 🎯 Próximos Passos

Após criar todos os buckets:

1. ✅ Buckets criados
2. ➡️ Prosseguir para [EDGE_FUNCTIONS_SETUP.md](./EDGE_FUNCTIONS_SETUP.md)
3. Configurar secrets
4. Conectar ao Lovable

---

## 📚 Referências

- [Documentação oficial do Supabase Storage](https://supabase.com/docs/guides/storage)
- [Storage RLS Policies](https://supabase.com/docs/guides/storage/security/access-control)
