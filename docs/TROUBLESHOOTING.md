# 🔧 Troubleshooting - Resolução de Problemas

## 🗄️ Erros de Banco de Dados

### "relation does not exist"
**Causa**: SQL não foi executado ou executou parcialmente.
**Solução**:
1. Abra SQL Editor no Supabase
2. Execute `DATABASE_COMPLETE.sql` novamente
3. Verifique se aparece "Success"

### "permission denied for table"
**Causa**: RLS policies não foram criadas.
**Solução**: Execute o SQL completo que já inclui as policies.

## ⚡ Erros de Edge Functions

### "Function failed to deploy"
**Causa**: Erro de sintaxe no código.
**Solução**:
1. Veja logs em Edge Functions → [nome] → Logs
2. Copie o código novamente do guia
3. Verifique se não faltou nenhuma parte

### "Missing environment variable"
**Causa**: Secrets não configurados.
**Solução**:
1. Vá em Project Settings → Edge Functions → Secrets
2. Adicione `LOVABLE_API_KEY`

### "Invalid license"
**Causa**: Licença não configurada ou inválida.
**Solução temporária**: Remova validação de licença das Edge Functions ou crie uma licença de teste.

## 📦 Erros de Storage

### "Bucket not found"
**Causa**: Buckets não foram criados.
**Solução**: Siga [STORAGE_SETUP.md](./STORAGE_SETUP.md)

### "File too large"
**Causa**: Arquivo excede limite.
**Solução**: Aumente limite em Storage → [bucket] → Settings

## 🔐 Erros de Autenticação

### "Invalid credentials"
**Causa**: Credenciais do Supabase incorretas.
**Solução**: Verifique `.env` e reconecte no Lovable.

### "Não consigo fazer login"
**Causa**: Email não confirmado.
**Solução**: Ative auto-confirm em Auth → Settings → Email Auth → "Enable email confirmations" = OFF

## 💳 Erros de Webhooks

### "Invalid signature"
**Causa**: Secret incorreto ou timestamp expirado.
**Solução**: Configure `KIWIFY_WEBHOOK_SECRET` correto e teste com timestamp recente.

Ver logs em Edge Functions → handle-purchase → Logs

---

## 📞 Suporte

Se o problema persistir:
1. Verifique [FAQ.md](./FAQ.md)
2. Abra issue no GitHub
3. Email: support@example.com
