# 📚 Plataforma Whitelabel de Ebooks

Uma plataforma completa e personalizável para venda e distribuição de ebooks com sistema de gamificação, comunidade integrada e painel administrativo.

---

## ✨ O que você vai ter

- ✅ **Plataforma completa de ebooks**
  - Visualizador de PDF integrado
  - Progresso de leitura sincronizado
  - Sistema de marcadores e anotações
  - Busca e navegação por capítulos

- ✅ **Sistema de gamificação**
  - 7 níveis de progressão
  - 10+ badges conquistáveis
  - Desafios semanais/mensais
  - Leaderboards e rankings
  - Sistema de XP e recompensas

- ✅ **Comunidade ativa**
  - Posts, comentários e curtidas
  - Compartilhamento de criações
  - Sistema de follows
  - Depoimentos e avaliações

- ✅ **Sistema de indicações**
  - Códigos de indicação únicos
  - Recompensas por conversão
  - Tracking de conversões

- ✅ **Moderação com IA**
  - Moderação automática de conteúdo
  - Análise de sentimento
  - Detecção de spam e abuso
  - Powered by Lovable AI

- ✅ **Sistema de licenciamento whitelabel**
  - Validação de licenças por domínio
  - Telemetria de uso
  - Controle de acesso granular

- ✅ **Integração com pagamentos**
  - Webhooks de Kiwify e Hotmart
  - Resgate automático de compras
  - Rastreamento de vendas

- ✅ **Painel administrativo**
  - Gestão completa de ebooks
  - Upload de PDFs e capas
  - Gerenciamento de usuários
  - Analytics e relatórios

---

## 🚀 Como usar este template

### Clone e Deploy Manual

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/seu-fork.git

# Instale dependências
npm install

# Configure .env
cp .env.example .env
# Edite .env com suas credenciais

# Rode localmente
npm run dev
```

---

## 📖 Documentação

### Guias Principais

| Documento | Descrição | Tempo |
|-----------|-----------|-------|
| [**SETUP.md**](docs/SETUP.md) | Guia completo passo-a-passo (12 etapas) | ~40 min |
| [**N8N_WORKFLOW_SETUP.md**](docs/N8N_WORKFLOW_SETUP.md) | **Workflow n8n completo para webhooks** | ~15 min |
| [DATABASE_COMPLETE.sql](docs/DATABASE_COMPLETE.sql) | SQL consolidado para executar no Supabase | ~5 min |
| [STORAGE_SETUP.md](docs/STORAGE_SETUP.md) | Como criar os 5 buckets de storage | ~3 min |
| [EDGE_FUNCTIONS_SETUP.md](docs/EDGE_FUNCTIONS_SETUP.md) | Documentação das 8 Edge Functions | ~10 min |

### Guias Auxiliares

- [CUSTOMIZATION.md](docs/CUSTOMIZATION.md) - Como personalizar cores, logos, textos
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitetura técnica do sistema
- [FAQ.md](docs/FAQ.md) - Perguntas frequentes
- [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Resolução de problemas comuns
- [VALIDATION_CHECKLIST.md](docs/VALIDATION_CHECKLIST.md) - Checklist de validação

---

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Shadcn UI** - Component library
- **TanStack Query** - Data fetching
- **React Router** - Routing
- **Framer Motion** - Animations

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Storage
  - Edge Functions
  - Realtime subscriptions

### Integrações
- **Lovable AI** - Moderação de conteúdo
- **Firebase Cloud Messaging** - Push notifications
- **Kiwify/Hotmart** - Webhooks de pagamento

---

## 📊 Estrutura do Banco de Dados

O banco possui **30+ tabelas** organizadas em:

- **Autenticação**: `profiles`, `user_roles`
- **Ebooks**: `ebooks`, `chapters`, `user_ebooks`, `user_progress`
- **Gamificação**: `user_gamification`, `xp_transactions`, `badges`, `challenges`
- **Comunidade**: `community_posts`, `post_likes`, `post_comments`, `testimonials`
- **Sistema**: `licenses`, `notifications`, `analytics_events`

Ver diagrama completo em [ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 🎨 Personalização

Este template é **100% personalizável**:

### Branding
```env
VITE_BRAND_NAME="Seu App"
VITE_DEFAULT_DESCRIPTION="Descrição do seu app"
```

### Visual
- **Cores**: `src/index.css` e `tailwind.config.ts`
- **Logos**: `public/og-image.jpg`, `public/favicon.ico`
- **Fontes**: `src/index.css`

### Funcionalidades
- Adicione/remova badges em `docs/DATABASE_COMPLETE.sql`
- Customize níveis XP na função `calculate_level()`
- Ajuste recompensas na tabela `rewards`

Ver guia completo em [CUSTOMIZATION.md](docs/CUSTOMIZATION.md)

---

## 🔒 Segurança

- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ Validação de licenças por domínio
- ✅ Rate limiting em endpoints públicos
- ✅ Validação de webhooks com assinaturas
- ✅ Sanitização de inputs
- ✅ Políticas de acesso granulares
- ✅ Auditoria de ações sensíveis

---

## 📈 Analytics e Métricas

O sistema rastreia automaticamente:

- Progresso de leitura por usuário
- XP e níveis conquistados
- Engajamento na comunidade
- Taxa de conversão de indicações
- Estatísticas de vendas
- Uso de licenças whitelabel

Acesse em: `/admin/analytics`

---

## 🆘 Suporte

### Problemas Comuns

Veja [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) para soluções de:
- Erros de autenticação
- Problemas de upload
- Webhooks não funcionando
- Edge functions falhando

### Precisa de Ajuda?

1. Verifique a [documentação completa](docs/)
2. Leia o [FAQ](docs/FAQ.md)
3. Abra uma issue no GitHub
4. Entre em contato: support@example.com

---

## 🎯 Roadmap

- [ ] PWA offline mode
- [ ] Modo leitura noturno
- [ ] Sincronização cross-device
- [ ] Integração com Google Analytics
- [ ] Suporte a ePub
- [ ] API pública
- [ ] Webhooks customizáveis
- [ ] Multi-idioma

---

## 📄 Licença

Este é um **template whitelabel** licenciado.  
Cada instância requer uma licença válida para funcionar.

Para mais informações sobre licenciamento, consulte a documentação.

---

## 🙏 Créditos

Template Whitelabel de Ebooks

### Tecnologias utilizadas:
- [Supabase](https://supabase.com) - Backend infraestrutura
- [Lovable](https://lovable.dev) - Plataforma de desenvolvimento
- [Shadcn UI](https://ui.shadcn.com) - Componentes
- [TailwindCSS](https://tailwindcss.com) - Styling
- [Lucide Icons](https://lucide.dev) - Ícones

---

## 🚀 Deploy

### Deploy Automático no Lovable

1. No Lovable, clique em **"Publish"**
2. Escolha um subdomínio: `seu-app.lovable.app`
3. Aguarde o build (~2 minutos)
4. ✅ Seu app está no ar!

### Deploy em Outro Provedor

```bash
# Build para produção
npm run build

# Deploy no Vercel
vercel deploy

# Deploy no Netlify
netlify deploy --prod

# Deploy no seu servidor
# Os arquivos estarão em ./dist
```

---

## 📱 PWA (Progressive Web App)

O app já está configurado como PWA:

- ✅ Instalável em dispositivos móveis
- ✅ Ícone personalizado
- ✅ Splash screen
- ✅ Service worker para cache
- ✅ Notificações push (com Firebase)

Para instalar:
1. Acesse o app no navegador mobile
2. Toque em "Adicionar à tela inicial"
3. O app será instalado como nativo

---

## 🔄 Atualizações

Para atualizar seu fork com novas features:

```bash
# Adicione o repositório original como upstream (se aplicável)
git remote add upstream https://github.com/your-username/your-repo.git

# Busque atualizações
git fetch upstream

# Merge das atualizações
git merge upstream/main

# Resolva conflitos se houver
# Commit e push
git push origin main
```

---

## 💡 Casos de Uso

Este template é perfeito para:

- 📚 Escolas e cursos online
- 🎨 Criadores de conteúdo
- 🏢 Empresas com material educativo
- 👩‍🏫 Professores e educadores
- 📖 Editoras digitais
- 🎓 Plataformas de conhecimento
- 💼 Consultores e coaches

---

## 🌟 Features Destaque

### Para Usuários Finais
- Experiência de leitura fluida
- Gamificação envolvente
- Comunidade ativa
- Sistema de recompensas

### Para Administradores
- Painel intuitivo
- Analytics detalhados
- Gestão simplificada
- Controle total

### Para Desenvolvedores
- Código limpo e documentado
- TypeScript end-to-end
- Fácil customização
- Arquitetura escalável

---

<div align="center">

**⭐ Se este template foi útil, deixe uma estrela no GitHub!**

Template Whitelabel - Personalize para sua marca

</div>
