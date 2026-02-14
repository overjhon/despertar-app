# 🔒 Guia de Segurança - Mundo Delas

Este documento contém as diretrizes de segurança implementadas e recomendações adicionais para manter a aplicação segura.

## ✅ Correções Implementadas

### 1. Proteção de Dados Pessoais
- ✅ View `public_profiles` não expõe email e WhatsApp
- ✅ Dados sensíveis acessíveis apenas ao próprio usuário
- ✅ RLS (Row-Level Security) habilitado em todas as tabelas

### 2. Validação de Inputs
- ✅ Schemas Zod implementados para todos os formulários
- ✅ Validação de email, senha, nome, posts e depoimentos
- ✅ Limites de tamanho e caracteres especiais
- ✅ Sanitização automática com `.trim()`

### 3. Proteção de Pagamentos
- ✅ Tabela `pending_purchases` com RLS restritivo
- ✅ Audit logging para rastreabilidade
- ✅ Função de limpeza automática (90/180 dias)

### 4. Autenticação de APIs
- ✅ Edge Function `moderate-content` requer JWT
- ✅ Verificação de usuário autenticado
- ✅ Logging de acessos

### 5. Controle de Privacidade
- ✅ `live_activity` restrito a usuários autenticados
- ✅ Dados de atividade não são públicos

### 6. Proteção de Senhas
- ✅ Mínimo 8 caracteres
- ✅ Obrigatório: maiúscula, minúscula e número
- ✅ **Leaked Password Protection habilitado**

## 🛡️ Recomendações Adicionais (Implementar Manualmente)

### 1. Rate Limiting
Proteja endpoints críticos contra brute force:

```typescript
// Exemplo: Limitar tentativas de login
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos

// Implementar contador de tentativas por IP/email
```

### 2. CAPTCHA nos Formulários
Adicione proteção contra bots:
- Cadastro de usuários
- Reset de senha
- Formulário de contato

Sugestão: Google reCAPTCHA v3 ou hCaptcha

### 3. Two-Factor Authentication (2FA)
Habilite 2FA para admins:

```typescript
// Supabase suporta TOTP nativamente
await supabase.auth.mfa.enroll({ factorType: 'totp' })
```

### 4. Content Security Policy (CSP)
Adicione headers CSP no `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.gpteng.co;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co https://lovableproject.com;
">
```

### 5. Auditoria de Logs
Implemente logging detalhado para ações críticas:
- Compras de ebooks
- Mudanças de senha
- Acesso a dados sensíveis
- Ações administrativas

### 6. Backup e Recuperação
Configure backups automáticos:
- Banco de dados: diário
- Arquivos de usuários: semanal
- Teste restauração mensalmente

### 7. Monitoramento em Produção
Ferramentas recomendadas:
- **Sentry** para erros JavaScript
- **LogRocket** para replay de sessões
- **Supabase Analytics** para métricas de DB

### 8. Segurança de Arquivos
Para uploads de mídia:
```typescript
// Validar tipo MIME real, não apenas extensão
const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const fileType = await getFileMimeType(file);
if (!validMimeTypes.includes(fileType)) {
  throw new Error('Tipo de arquivo não permitido');
}
```

### 9. HTTPS Obrigatório
Verifique se o app força HTTPS:
```typescript
if (window.location.protocol !== 'https:' && !window.location.hostname.includes('localhost')) {
  window.location.href = `https://${window.location.href.substring(window.location.protocol.length)}`;
}
```

### 10. Session Timeout
Implemente logout automático após inatividade:
```typescript
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos
let inactivityTimer: NodeJS.Timeout;

const resetTimer = () => {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    supabase.auth.signOut();
  }, INACTIVITY_TIMEOUT);
};

// Resetar em qualquer interação
document.addEventListener('click', resetTimer);
document.addEventListener('keypress', resetTimer);
```

## 🔍 Checklist de Segurança Pré-Deploy

### Antes de Lançar em Produção:

- [ ] Revisar todas as políticas RLS manualmente
- [ ] Executar `supabase db lint` e corrigir todos os warnings
- [ ] Testar fluxos de autenticação com diferentes cenários
- [ ] Verificar se dados sensíveis não aparecem nos logs
- [ ] Confirmar que backups estão configurados
- [ ] Habilitar monitoramento de erros
- [ ] Adicionar CAPTCHA nos formulários críticos
- [ ] Implementar rate limiting
- [ ] Configurar CSP headers
- [ ] Testar recuperação de senha
- [ ] Validar que usuários não podem acessar dados de outros
- [ ] Executar teste de penetração básico
- [ ] Revisar permissões dos buckets de storage
- [ ] Confirmar que .env não está no repositório
- [ ] Habilitar 2FA para todas as contas admin

## 📞 Contato de Segurança

Se você descobrir uma vulnerabilidade de segurança, por favor:

1. **NÃO** abra uma issue pública
2. Envie email para: security@example.com
3. Inclua descrição detalhada e passos para reproduzir
4. Aguarde confirmação antes de divulgar publicamente

## 📚 Recursos de Referência

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [React Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/React_Security_Cheat_Sheet.html)
- [Lovable Security Docs](https://docs.lovable.dev/features/security)

---

**Última atualização:** 2025-10-18  
**Próxima revisão:** 2025-11-18 (mensal)
