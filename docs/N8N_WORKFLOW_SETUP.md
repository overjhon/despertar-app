# 🔄 Guia Completo: Workflow n8n para Webhooks

Este guia documenta o workflow n8n que processa webhooks de plataformas de pagamento (Cakto, Kiwify, Hotmart) e envia para a edge function `handle-purchase`.

---

## 📊 Visão Geral do Fluxo

```
Plataforma de Pagamento (Cakto/Kiwify)
    ↓
[1] Webhook (n8n recebe POST)
    ↓
[2] Extrair Campos (mapeia dados)
    ↓
[3] Verificar Evento (filtra purchase_approved)
    ↓
[4] Preparar Dados (payload + timestamp + secret)
    ↓
[5] Gerar Hash SHA256 (assinatura)
    ↓
[6] Adicionar Headers (combina tudo)
    ↓
[7] Enviar para Lovable (POST para edge function)
    ↓
[8] Log Sucesso (console.log)
    ↓
[9] Enviar WhatsApp (Evolution API - opcional)
```

---

## 🛠️ Configuração no n8n

### PASSO 1: Criar Credencial do Webhook Secret

1. No n8n, vá em **Credentials** → **Add Credential**
2. Escolha **Generic Credential**
3. Configure:
   - **Name**: `WEBHOOK_SECRET`
   - **Value**: Gere um secret seguro (ex: resultado de `openssl rand -hex 32`)
4. Clique em **Save**

⚠️ **IMPORTANTE**: Anote este secret! Você NÃO vai configurá-lo no Supabase (n8n valida antes de enviar).

---

### PASSO 2: Importar Workflow

1. No n8n, clique em **Workflows** → **Add Workflow** → **Import from File/URL**
2. Cole o JSON abaixo (ou importe de arquivo)

---

## 📄 Workflow JSON

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "webhook-compras",
        "options": {}
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.1,
      "position": [400, 200],
      "id": "webhook-node",
      "name": "Webhook",
      "webhookId": "GERAR_AUTOMATICAMENTE"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "event",
              "name": "event",
              "value": "={{ $json.body.event }}",
              "type": "string"
            },
            {
              "id": "customer_email",
              "name": "customer_email",
              "value": "={{ $json.body.data.customer.email }}",
              "type": "string"
            },
            {
              "id": "product_name",
              "name": "product_name",
              "value": "={{ $json.body.data.product.name }}",
              "type": "string"
            },
            {
              "id": "product_id",
              "name": "product_id",
              "value": "={{ $json.body.data.product.id }}",
              "type": "string"
            },
            {
              "id": "amount",
              "name": "amount",
              "value": "={{ $json.body.data.amount }}",
              "type": "number"
            },
            {
              "id": "transaction_id",
              "name": "transaction_id",
              "value": "={{ $json.body.data.id }}",
              "type": "string"
            },
            {
              "id": "paid_at",
              "name": "paid_at",
              "value": "={{ $json.body.data.paidAt }}",
              "type": "string"
            },
            {
              "id": "telefone",
              "name": "telefone",
              "value": "={{ $json.body.data.customer.phone }}",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [640, 200],
      "id": "extract-node",
      "name": "Extrair Campos"
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "typeValidation": "strict"
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.event }}",
                    "rightValue": "purchase_approved",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ]
              },
              "renameOutput": true,
              "outputKey": "approved"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.3,
      "position": [860, 200],
      "id": "switch-node",
      "name": "Verificar Evento"
    },
    {
      "parameters": {
        "jsCode": "// Preparar payload e timestamp\nconst data = $input.item.json;\n\nconst payload = {\n  email: data.customer_email,\n  ebook_id: data.product_id,\n  ebook_name: data.product_name,\n  amount: data.amount,\n  transaction_id: data.transaction_id,\n  paid_at: data.paid_at\n};\n\nconst payloadString = JSON.stringify(payload);\nconst timestamp = Date.now().toString();\n\n// IMPORTANTE: Use a credencial WEBHOOK_SECRET criada anteriormente\nconst secret = $credentials.WEBHOOK_SECRET.value;\n\n// Combinar para gerar hash\nconst dataToHash = payloadString + timestamp + secret;\n\nreturn {\n  json: {\n    payload: payload,\n    timestamp: timestamp,\n    dataToHash: dataToHash\n  }\n};"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1080, 200],
      "id": "prepare-node",
      "name": "Preparar Dados",
      "credentials": {
        "genericCredential": {
          "id": "WEBHOOK_SECRET",
          "name": "WEBHOOK_SECRET"
        }
      }
    },
    {
      "parameters": {
        "type": "SHA256",
        "value": "={{ $json.dataToHash }}"
      },
      "type": "n8n-nodes-base.crypto",
      "typeVersion": 1,
      "position": [1300, 200],
      "id": "crypto-node",
      "name": "Gerar Hash SHA256"
    },
    {
      "parameters": {
        "jsCode": "// Combinar payload + headers com assinatura\nconst preparedData = $('Preparar Dados').item.json;\nconst signature = $input.item.json.data;\n\nreturn {\n  json: {\n    email: preparedData.payload.email,\n    ebook_id: preparedData.payload.ebook_id,\n    ebook_name: preparedData.payload.ebook_name,\n    amount: preparedData.payload.amount,\n    transaction_id: preparedData.payload.transaction_id,\n    paid_at: preparedData.payload.paid_at,\n    signature: signature,\n    timestamp: preparedData.timestamp\n  }\n};"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1520, 200],
      "id": "headers-node",
      "name": "Adicionar Headers"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://SEU-PROJETO.supabase.co/functions/v1/handle-purchase",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "X-License-Key",
              "value": "SUA_LICENSE_KEY_AQUI"
            },
            {
              "name": "X-Signature",
              "value": "={{ $json.signature }}"
            },
            {
              "name": "X-Timestamp",
              "value": "={{ $json.timestamp }}"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "email",
              "value": "={{ $json.email }}"
            },
            {
              "name": "ebook_id",
              "value": "={{ $json.ebook_id }}"
            },
            {
              "name": "ebook_name",
              "value": "={{ $json.ebook_name }}"
            },
            {
              "name": "amount",
              "value": "={{ $json.amount }}"
            },
            {
              "name": "transaction_id",
              "value": "={{ $json.transaction_id }}"
            },
            {
              "name": "paid_at",
              "value": "={{ $json.paid_at }}"
            }
          ]
        },
        "options": {
          "timeout": 30000
        }
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1740, 200],
      "id": "http-node",
      "name": "Enviar para Lovable"
    },
    {
      "parameters": {
        "jsCode": "// Log de sucesso\nconst originalData = $('Extrair Campos').item.json;\nconst email = originalData.customer_email;\nconst obfuscated = email.substring(0, 3) + '***@' + email.split('@')[1];\n\nconsole.log('✅ Compra processada!');\nconsole.log('📧 Email:', obfuscated);\nconsole.log('🆔 Transaction:', originalData.transaction_id);\nconsole.log('💰 Valor:', originalData.amount);\n\nreturn { \n  json: { \n    success: true, \n    transaction_id: originalData.transaction_id,\n    email_obfuscated: obfuscated\n  } \n};"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1960, 200],
      "id": "log-node",
      "name": "Log Sucesso"
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "Extrair Campos", "type": "main", "index": 0}]]
    },
    "Extrair Campos": {
      "main": [[{"node": "Verificar Evento", "type": "main", "index": 0}]]
    },
    "Verificar Evento": {
      "main": [[{"node": "Preparar Dados", "type": "main", "index": 0}]]
    },
    "Preparar Dados": {
      "main": [[{"node": "Gerar Hash SHA256", "type": "main", "index": 0}]]
    },
    "Gerar Hash SHA256": {
      "main": [[{"node": "Adicionar Headers", "type": "main", "index": 0}]]
    },
    "Adicionar Headers": {
      "main": [[{"node": "Enviar para Lovable", "type": "main", "index": 0}]]
    },
    "Enviar para Lovable": {
      "main": [[{"node": "Log Sucesso", "type": "main", "index": 0}]]
    }
  }
}
```

---

## 🔧 Configuração Detalhada

### Node 1: Webhook

**Configuração**:
- **Method**: POST
- **Path**: `webhook-compras` (personalize se quiser)
- **Authentication**: None (a plataforma envia secret no body)

**URL gerada pelo n8n**: `https://seu-n8n.com/webhook/webhook-compras`

Configure esta URL na sua plataforma de pagamento (Cakto/Kiwify/Hotmart).

---

### Node 2: Extrair Campos

Mapeia dados do webhook para formato esperado:

```javascript
{
  event: "purchase_approved",
  customer_email: "cliente@email.com",
  product_name: "Nome do Ebook",
  product_id: "produto-123",
  amount: 47.90,
  transaction_id: "TXN-ABC123",
  paid_at: "2024-01-15T10:30:00Z",
  telefone: "5511999999999"
}
```

---

### Node 3: Verificar Evento

Filtra apenas eventos `purchase_approved`. Outros eventos (refund, canceled) são ignorados.

---

### Node 4: Preparar Dados

**CRÍTICO**: Este node usa a credencial `WEBHOOK_SECRET`.

```javascript
const payload = {
  email: data.customer_email,
  ebook_id: data.product_id,
  ebook_name: data.product_name,
  amount: data.amount,
  transaction_id: data.transaction_id,
  paid_at: data.paid_at
};

const payloadString = JSON.stringify(payload);
const timestamp = Date.now().toString();

// Busca secret da credencial do n8n
const secret = $credentials.WEBHOOK_SECRET.value;

// String para gerar hash
const dataToHash = payloadString + timestamp + secret;
```

**⚠️ Importante**: 
- O secret DEVE ser o mesmo usado no futuro (caso você implemente validação no backend)
- Por ora, ele é apenas para auditoria (logs)

---

### Node 5: Gerar Hash SHA256

Cria hash SHA256 da string `payload + timestamp + secret`:

```
Input: {"email":"..."}1737049830000a7f3e9d2c1b4f6e8...
Output: d4a5c2b1f8e9a3d7c6b5f4e8a2d9c1b6f7e5a4d3c8b9f2e1a7d6c5b4f3e2a1d0
```

Este hash vai no header `X-Signature`.

---

### Node 6: Adicionar Headers

Combina payload + signature + timestamp:

```json
{
  "email": "cliente@email.com",
  "ebook_id": "produto-123",
  "ebook_name": "Guia de Velas",
  "amount": 47.90,
  "transaction_id": "TXN-ABC123",
  "paid_at": "2024-01-15T10:30:00Z",
  "signature": "d4a5c2b1f8e9a3d7c6b5f4e8a2d9c1b6f7e5a4d3c8b9f2e1a7d6c5b4f3e2a1d0",
  "timestamp": "1737049830000"
}
```

---

### Node 7: Enviar para Lovable

**POST** para `https://SEU-PROJETO.supabase.co/functions/v1/handle-purchase`

**Headers**:
```
Content-Type: application/json
X-License-Key: SUA_LICENSE_KEY_AQUI
X-Signature: d4a5c2b1f8e9a3d7c6b5f4e8a2d9c1b6f7e5a4d3c8b9f2e1a7d6c5b4f3e2a1d0
X-Timestamp: 1737049830000
```

**Body**:
```json
{
  "email": "cliente@email.com",
  "ebook_id": "produto-123",
  "ebook_name": "Guia de Velas",
  "amount": 47.90,
  "transaction_id": "TXN-ABC123",
  "paid_at": "2024-01-15T10:30:00Z"
}
```

**⚠️ IMPORTANTE**: Substitua `SUA_LICENSE_KEY_AQUI` pela licença whitelabel do cliente!

---

### Node 8: Log Sucesso

Registra no console do n8n (para debug):

```
✅ Compra processada!
📧 Email: cli***@email.com
🆔 Transaction: TXN-ABC123
💰 Valor: 47.9
```

---

## 📱 Integração WhatsApp (Opcional)

Se quiser enviar mensagem de boas-vindas após compra:

### Node 9: Enviar WhatsApp (Evolution API)

```javascript
// Adicione após "Log Sucesso"
{
  "parameters": {
    "resource": "messages-api",
    "instanceName": "sua-instancia",
    "remoteJid": "={{ $('Extrair Campos').item.json.telefone }}",
    "messageText": "Oi! 💕\n\nObrigada por adquirir o ebook!\n\nAcesse: https://seuapp.com\nCrie conta com: {{ $('Extrair Campos').item.json.customer_email }}\n\nPronto! ✨",
    "options_message": {
      "delay": 1200
    }
  },
  "type": "n8n-nodes-evolution-api.evolutionApi",
  "name": "Enviar WhatsApp",
  "credentials": {
    "evolutionApi": {
      "id": "SUA_CREDENTIAL_EVOLUTION",
      "name": "evolution-api"
    }
  }
}
```

**Conecte**:
```
Log Sucesso → Enviar WhatsApp
```

---

## ✅ Checklist de Configuração

Antes de ativar o workflow:

- [ ] Credencial `WEBHOOK_SECRET` criada no n8n
- [ ] URL do Supabase atualizada no node "Enviar para Lovable"
- [ ] `X-License-Key` configurado com licença válida
- [ ] Webhook testado com dados de exemplo (use "Execute Workflow")
- [ ] URL do webhook configurada na plataforma de pagamento
- [ ] Workflow ativado (toggle verde)

---

## 🧪 Como Testar

### Teste 1: Executar Manualmente

1. No n8n, abra o workflow
2. Clique em **"Execute Workflow"**
3. Use dados de exemplo (pinData)
4. Verifique se todos os nodes executam sem erro
5. Confira logs da edge function no Supabase

### Teste 2: Simular Webhook Real

```bash
# Envie POST para URL do n8n
curl -X POST 'https://seu-n8n.com/webhook/webhook-compras' \
  -H 'Content-Type: application/json' \
  -d '{
    "event": "purchase_approved",
    "data": {
      "id": "test-123",
      "customer": {
        "email": "teste@email.com",
        "phone": "5511999999999"
      },
      "product": {
        "id": "produto-test",
        "name": "Ebook Teste"
      },
      "amount": 19.90,
      "paidAt": "2024-01-15T10:30:00Z"
    }
  }'
```

### Teste 3: Compra Real (Sandbox)

Use ambiente de testes da plataforma de pagamento:
1. Configure webhook para URL do n8n
2. Faça compra no sandbox
3. Verifique execução no n8n
4. Confirme dados no Supabase

---

## 🐛 Troubleshooting

### Erro: "Cannot read property 'value' of undefined"

**Causa**: Credencial `WEBHOOK_SECRET` não configurada.

**Solução**:
1. Vá em Credentials → WEBHOOK_SECRET
2. Certifique-se que tem um valor
3. Reconecte no node "Preparar Dados"

---

### Erro: "Request failed with status code 403"

**Causa**: Licença inválida ou expirada.

**Solução**:
1. Verifique `X-License-Key` no node "Enviar para Lovable"
2. Confirme que a licença existe na tabela `licenses` do Supabase
3. Verifique se domínio está em `allowed_domains`

---

### Erro: "Timeout after 30000ms"

**Causa**: Edge function demorou mais de 30s.

**Solução**:
1. Aumente timeout no node "Enviar para Lovable"
2. Otimize edge function (remova logs desnecessários)
3. Verifique performance do Supabase

---

### Webhook não executa

**Causa**: URL não configurada na plataforma ou workflow desativado.

**Solução**:
1. Ative workflow (toggle verde)
2. Copie URL exata do webhook (pode ter mudado)
3. Cole na plataforma de pagamento
4. Teste enviando POST manual

---

## 📊 Monitoramento

### Logs no n8n

1. Vá em **Executions**
2. Veja histórico de execuções
3. Clique em cada execução para ver detalhes
4. Verifique node por node

### Logs no Supabase

1. Vá em **Edge Functions** → **Logs**
2. Filtre por função: `handle-purchase`
3. Busque por `[PURCHASE]` nos logs
4. Identifique erros ou transações processadas

---

## 🔒 Segurança

### Recomendações

1. **Secret único por cliente**: Cada whitelabel deve ter seu próprio `WEBHOOK_SECRET`
2. **HTTPS obrigatório**: Nunca use HTTP
3. **Rate limiting**: Configurado automaticamente na edge function (20 req/min)
4. **Logs ofuscados**: Emails são mascarados nos logs (ex: `cli***@email.com`)
5. **Credenciais n8n**: Use credenciais, não hardcode valores

### Auditoria

- Todos os webhooks são registrados em `pending_purchases` ou `user_ebooks`
- Transações duplicadas são bloqueadas (chave `transaction_id`)
- IPs suspeitos são logados para análise

---

## 📚 Recursos

- [n8n Documentation](https://docs.n8n.io/)
- [Evolution API Docs](https://doc.evolution-api.com/)
- [Cakto Webhooks](https://docs.cakto.com.br/webhooks)
- [Kiwify Webhooks](https://ajuda.kiwify.com.br/webhooks)

---

**Próximo**: [Configurar Licenças →](SETUP.md#passo-8)
