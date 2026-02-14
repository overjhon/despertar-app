# ❓ Perguntas Frequentes (FAQ)

## Geral

**P: Quanto custa usar este template?**
R: O template é whitelabel (requer licença). Custos: Supabase free tier + Lovable (conforme uso) + licença whitelabel.

**P: Posso vender para múltiplos clientes?**
R: Sim! Cada cliente precisa de uma licença própria configurada na tabela `licenses`.

**P: Funciona com Hotmart/Kiwify/Monetizze?**
R: Sim! Configure o webhook na plataforma apontando para `handle-purchase`.

## Técnico

**P: Como adicionar um novo admin?**
R: Execute no SQL Editor:
```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'email@exemplo.com';
```

**P: Como criar uma licença whitelabel?**
R: Insira na tabela `licenses`:
```sql
INSERT INTO licenses (license_key, owner_email, allowed_domains, status)
VALUES ('CHAVE-UNICA', 'cliente@email.com', ARRAY['cliente.com'], 'active');
```

**P: Como configurar webhooks de pagamento?**
R: Configure no n8n para enviar requisição POST para `https://[seu-projeto].supabase.co/functions/v1/handle-purchase` com headers `X-License-Key` (sua licença), `X-Signature` e `X-Timestamp`. O n8n valida o webhook da plataforma de pagamento antes de enviar.

**P: Posso usar meu próprio domínio?**
R: Sim! Configure em Lovable → Settings → Domains.

Ver mais em [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
