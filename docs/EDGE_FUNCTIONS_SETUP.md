# 🚀 Guia de Setup de Edge Functions

Este guia explica como criar e configurar as **8 Edge Functions** da plataforma.

---

## 📋 Lista de Funções

| # | Nome | Descrição | Auth | Secrets |
|---|------|-----------|------|---------|
| 1 | `handle-purchase` | Processa webhooks via n8n | ❌ | Nenhum |
| 2 | `claim-purchases` | Resgata compras pendentes | ✅ | Nenhum |
| 3 | `moderate-content` | Moderação com IA | ✅ | `LOVABLE_API_KEY` |
| 4 | `process-referral` | Sistema de indicações | ✅ | Nenhum |
| 5 | `process-referral-reward` | Recompensas de indicação | ✅ | Nenhum |
| 6 | `seed-database` | Popular dados de teste | ✅ | `LOVABLE_API_KEY` |
| 7 | `send-push` | Notificações push | ✅ | `FIREBASE_SERVER_KEY` (opcional) |
| 8 | `send-test-webhook` | Testar webhooks | ❌ | Nenhum |

---

## 🛠️ Como Criar uma Edge Function

Para cada função:

1. No Supabase, vá em **"Edge Functions"**
2. Clique em **"Create Function"**
3. Cole o nome (ex: `handle-purchase`)
4. Abra o arquivo `supabase/functions/[nome]/index.ts`
5. Copie **TODO** o código do arquivo
6. Cole no editor do Supabase
7. Clique em **"Deploy"**
8. Aguarde o deploy (~10-30 segundos)

---

## 1️⃣ handle-purchase

**Descrição**: Recebe webhooks de compra via n8n (Kiwify, Hotmart, etc). O n8n valida o webhook da plataforma e envia os dados validados para esta function.

**Fluxo**: 
```
Plataforma de Pagamento → n8n (valida) → handle-purchase (processa)
```

**Autenticação**: ❌ Não requer (n8n já validou)

**Secrets necessários**: Nenhum! (n8n valida antes de enviar)

**Headers obrigatórios**:
- `X-License-Key` - Licença whitelabel do cliente
- `X-Signature` - (opcional, para log/auditoria)
- `X-Timestamp` - (opcional, para log/auditoria)

**Segurança**:
- ✅ Validação de licença via `validate_license` RPC
- ✅ Rate limiting (20 req/min por IP)
- ✅ Validação Zod do payload
- ✅ n8n valida a origem do webhook antes de enviar

**Código**: `supabase/functions/handle-purchase/index.ts`

**Configuração no config.toml**:
```toml
[functions.handle-purchase]
verify_jwt = false  # Webhook público (n8n validou)
```

**Como configurar no n8n**:
```json
{
  "method": "POST",
  "url": "https://SEU-PROJETO.supabase.co/functions/v1/handle-purchase",
  "headers": {
    "Content-Type": "application/json",
    "X-License-Key": "{{ $env.LICENSE_KEY }}",
    "X-Signature": "{{ $json.signature }}",
    "X-Timestamp": "{{ $json.timestamp }}"
  },
  "body": {
    "email": "{{ $json.email }}",
    "ebook_id": "{{ $json.product_id }}",
    "ebook_name": "{{ $json.product_name }}",
    "amount": "{{ $json.amount }}",
    "transaction_id": "{{ $json.transaction_id }}",
    "paid_at": "{{ $json.paid_at }}"
  }
}
```

**Teste via curl**:
```bash
curl -X POST 'https://SEU-PROJETO.supabase.co/functions/v1/handle-purchase' \
  -H 'Content-Type: application/json' \
  -H 'X-License-Key: SUA_LICENSE_KEY' \
  -d '{
    "email": "cliente@exemplo.com",
    "ebook_id": "produto-123",
    "ebook_name": "Guia de Velas",
    "amount": 47.00,
    "transaction_id": "TXN-12345",
    "paid_at": "2024-01-15T10:30:00Z"
  }'
```

---

## 2️⃣ claim-purchases

**Descrição**: Permite usuários resgatarem compras pendentes vinculadas ao email.

**Autenticação**: ✅ Requer autenticação

**Código**: `supabase/functions/claim-purchases/index.ts`

**Configuração no config.toml**:
```toml
[functions.claim-purchases]
verify_jwt = true  # Requer autenticação
```

**Como testar**:
```javascript
const { data } = await supabase.functions.invoke('claim-purchases', {
  headers: {
    Authorization: `Bearer ${session.access_token}`,
    'X-License-Key': 'SUA_LICENSE_KEY'
  }
});
```

---

## 3️⃣ moderate-content

**Descrição**: Modera conteúdo usando IA (Lovable AI) para detectar spam, discurso de ódio, etc.

**Autenticação**: ✅ Requer autenticação

**Secrets necessários**: `LOVABLE_API_KEY` (obrigatório)

**Código**: `supabase/functions/moderate-content/index.ts`

**Configuração no config.toml**:
```toml
[functions.moderate-content]
verify_jwt = true
```

**Como testar**:
```javascript
const { data } = await supabase.functions.invoke('moderate-content', {
  body: {
    contentType: 'post',
    contentId: 'abc-123',
    content: 'Texto para moderar...'
  }
});
```

---

## 4️⃣ process-referral

**Descrição**: Gerencia sistema de indicações (criar códigos, marcar conversões).

**Autenticação**: ✅ Requer autenticação

**Código**: `supabase/functions/process-referral/index.ts`

**Configuração no config.toml**:
```toml
[functions.process-referral]
verify_jwt = true
```

**Como testar**:
```javascript
// Criar código de indicação
const { data } = await supabase.functions.invoke('process-referral', {
  body: {
    action: 'create'
  }
});

// Marcar conversão
const { data } = await supabase.functions.invoke('process-referral', {
  body: {
    action: 'convert',
    referralCode: 'ABC12345',
    email: 'novousuario@exemplo.com'
  }
});
```

---

## 5️⃣ process-referral-reward

**Descrição**: Processa recompensas de indicações (ebook grátis após 2 conversões).

**Autenticação**: ✅ Requer autenticação

**Código**: `supabase/functions/process-referral-reward/index.ts`

**Configuração no config.toml**:
```toml
[functions.process-referral-reward]
verify_jwt = true
```

---

## 6️⃣ seed-database

**Descrição**: Popula banco com dados de teste (usuários, posts, depoimentos com IA).

**Autenticação**: ✅ Requer autenticação

**Secrets necessários**: `LOVABLE_API_KEY` (obrigatório) - Para gerar conteúdo com IA

**Código**: `supabase/functions/seed-database/index.ts`

**Configuração no config.toml**:
```toml
[functions.seed-database]
verify_jwt = true
```

**Como testar**:
```bash
# Criar 30 usuários com dados realistas
curl -X POST 'https://SEU-PROJETO.supabase.co/functions/v1/seed-database' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'X-License-Key: SUA_LICENSE' \
  -H 'Content-Type: application/json' \
  -d '{"userCount": 30, "cleanOldData": false}'
```

---

## 7️⃣ send-push

**Descrição**: Envia notificações push para usuários filtrados por nível, role, etc.

**Autenticação**: ✅ Requer autenticação

**Secrets necessários**: `FIREBASE_SERVER_KEY` (opcional) - Para push real via Firebase

**Código**: `supabase/functions/send-push/index.ts`

**Configuração no config.toml**:
```toml
[functions.send-push]
verify_jwt = true
```

**Como testar**:
```bash
# Enviar para usuários nível 3-5 com streak 7+
curl -X POST 'https://SEU-PROJETO.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Nova recompensa!",
    "message": "Você ganhou 100 XP",
    "filters": {
      "role": "any",
      "minLevel": 3,
      "maxLevel": 5,
      "streakMin": 7
    },
    "dryRun": true
  }'
```

---

## 8️⃣ send-test-webhook

**Descrição**: Envia webhook de teste para validar configuração.

**Autenticação**: ❌ Não requer

**Código**: `supabase/functions/send-test-webhook/index.ts`

**Configuração no config.toml**:
```toml
[functions.send-test-webhook]
verify_jwt = false
```

**Como testar**:
```bash
curl -X POST 'https://SEU-PROJETO.supabase.co/functions/v1/send-test-webhook' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://webhook.site/seu-id",
    "secret": "opcional"
  }'
```

---

## 📋 Checklist Final

Após criar todas as Edge Functions, verifique:

- [ ] Todas as 8 funções criadas no Supabase
- [ ] Deploy realizado com sucesso (status verde)
- [ ] `LOVABLE_API_KEY` configurado nos Secrets
- [ ] `FIREBASE_SERVER_KEY` configurado (se usar push)
- [ ] Teste básico de `handle-purchase` com curl
- [ ] Teste básico de `claim-purchases` após login
- [ ] Logs sem erros em "Edge Functions" → "Logs"

---

## 🐛 Troubleshooting

**Erro: "Function not found"**
- Verifique se o nome está correto
- Aguarde 30s após deploy
- Recarregue a página

**Erro: "Missing secret: LOVABLE_API_KEY"**
- Vá em Settings → Edge Functions → Secrets
- Adicione `LOVABLE_API_KEY` com valor de lovable.dev/settings

**Erro: "License invalid"**
- Certifique-se de enviar header `X-License-Key`
- Verifique se a licença existe na tabela `licenses`
- Confirme que o domínio está em `allowed_domains`

**Timeout / Slow response**
- Edge functions têm cold start (~200ms primeira vez)
- Após primeira invocação, ficam "warm" (rápidas)
- Logs em "Edge Functions" → "Logs" → Filtrar por função

---

## 📚 Recursos

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy Docs](https://docs.deno.com/deploy/manual)
- [Lovable AI Gateway](https://docs.lovable.dev/ai-gateway)

---

**Próximo**: [Conectar Supabase no Lovable →](SETUP.md#passo-7)
