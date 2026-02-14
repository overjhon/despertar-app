# 🏗️ Arquitetura do Sistema

Visão completa da estrutura técnica do template whitelabel de ebooks.

---

## 📊 Visão Geral

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│  • Vite + TypeScript                                    │
│  • React Router v6                                      │
│  • TanStack Query (React Query)                         │
│  • Shadcn/ui + Tailwind CSS                             │
│  • Framer Motion                                        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ HTTPS (REST)
                   │
┌──────────────────▼──────────────────────────────────────┐
│               SUPABASE (Backend)                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ PostgreSQL Database (RLS Habilitado)             │  │
│  │  • 30+ Tabelas                                   │  │
│  │  • 20+ Functions                                 │  │
│  │  • 15+ Triggers                                  │  │
│  │  • Views (public_profiles)                       │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Edge Functions (Deno)                            │  │
│  │  • handle-purchase                               │  │
│  │  • claim-purchases                               │  │
│  │  • moderate-content (Lovable AI)                 │  │
│  │  • process-referral                              │  │
│  │  • seed-database                                 │  │
│  │  • send-push                                     │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Storage Buckets                                  │  │
│  │  • avatars (public)                              │  │
│  │  • covers (public)                               │  │
│  │  • ebooks (public)                               │  │
│  │  • samples (public)                              │  │
│  │  • community-media (public)                      │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Authentication (Supabase Auth)                   │  │
│  │  • Email/Password                                │  │
│  │  • Session Management                            │  │
│  │  • RLS Policies                                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                   │
                   │ Webhooks
                   │
┌──────────────────▼──────────────────────────────────────┐
│           INTEGRAÇÕES EXTERNAS                          │
│  • Kiwify (Pagamentos)                                  │
│  • Hotmart (Pagamentos)                                 │
│  • Lovable AI (Moderação, Seed)                         │
│  • Firebase (Push Notifications - Opcional)             │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### 👤 **Usuários e Autenticação**
```
auth.users (Supabase gerenciado)
  ↓
profiles
  ↓
user_roles (admin, user)
  ↓
user_gamification
```

#### 📚 **Ebooks e Conteúdo**
```
ebooks
  ├─ chapters
  ├─ user_ebooks (biblioteca do usuário)
  ├─ user_progress (progresso de leitura)
  └─ testimonials
```

#### 🏆 **Gamificação**
```
badges
  ├─ user_badges (badges conquistados)
  └─ criteria (JSON)

challenges
  ├─ user_challenges (desafios ativos)
  └─ goal_type

xp_transactions (histórico de XP)
  ↓
user_gamification
  ├─ total_xp
  ├─ current_level
  ├─ current_streak_days
  └─ statistics

daily_reading_stats (por dia)
  ├─ pages_read
  ├─ xp_earned
  └─ reading_time_minutes
```

#### 🌐 **Comunidade**
```
community_posts
  ├─ post_likes
  ├─ post_comments
  └─ content_moderation

community_creations (criações de usuários)
  └─ creation_likes

testimonials
  ├─ testimonial_likes
  ├─ testimonial_comments
  └─ testimonial_media
```

#### 💰 **Sistema de Compras**
```
pending_purchases (webhook armazena aqui)
  ↓
user_ebooks (resgate via claim-purchases)
  ↓
purchase_clicks (analytics)
```

#### 🔗 **Sistema de Indicações**
```
referrals
  ├─ referrer_id
  ├─ referred_user_id
  ├─ referral_code
  ├─ status (pending, converted)
  └─ reward_type
```

#### 📜 **Sistema de Licenças**
```
licenses
  ├─ license_key
  ├─ allowed_domains[]
  ├─ status
  └─ max_users

license_usage (telemetria)
  ├─ domain
  └─ last_check_at
```

#### 🔔 **Notificações**
```
notifications
  ├─ user_id
  ├─ type
  ├─ read
  └─ link

push_subscriptions (FCM tokens)
  ├─ user_id
  ├─ fcm_token
  └─ enabled
```

---

## 🔒 Row Level Security (RLS)

Todas as tabelas têm RLS habilitado. Principais políticas:

### Padrão de Segurança

```sql
-- Usuários podem ver seus próprios dados
CREATE POLICY "Users can view own data"
ON table_name FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem inserir seus próprios dados
CREATE POLICY "Users can insert own data"
ON table_name FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios dados
CREATE POLICY "Users can update own data"
ON table_name FOR UPDATE
USING (auth.uid() = user_id);

-- Admins podem fazer tudo
CREATE POLICY "Admins can manage"
ON table_name FOR ALL
USING (has_role(auth.uid(), 'admin'));
```

### Dados Públicos

```sql
-- Posts públicos visíveis para todos
CREATE POLICY "Public posts visible"
ON community_posts FOR SELECT
USING (is_public = true);

-- Ebooks ativos visíveis para autenticados
CREATE POLICY "Active ebooks visible"
ON ebooks FOR SELECT
USING (is_active = true);
```

### Proteção de Dados Sensíveis

```sql
-- Profiles: apenas dados públicos na view
CREATE VIEW public_profiles AS
SELECT id, full_name, avatar_url, bio, created_at
FROM profiles;
-- Email e whatsapp NÃO são expostos

-- pending_purchases: apenas backend
CREATE POLICY "Backend only access"
ON pending_purchases FOR ALL
USING (false) WITH CHECK (false);
```

---

## ⚙️ Funções e Triggers

### Funções SQL Principais

```sql
-- Gamificação
calculate_level(xp INTEGER) → INTEGER
get_level_name(level INTEGER) → TEXT
get_xp_for_level(level INTEGER) → INTEGER

-- Roles e Permissões
has_role(user_id UUID, role app_role) → BOOLEAN
assign_admin_role() → TRIGGER

-- Notificações
create_notification(...) → UUID

-- Sistema de Indicações
generate_referral_code() → TEXT

-- Licenciamento
validate_license(license_key TEXT, origin TEXT) → BOOLEAN
extract_hostname(origin TEXT) → TEXT

-- Conversões
get_ebook_id_for_product(product_id TEXT) → UUID

-- Rate Limiting
check_rate_limit(...) → JSONB
reset_rate_limit(...) → VOID
```

### Triggers Principais

```sql
-- Ao criar usuário
on_auth_user_created → handle_new_user()
on_auth_user_created_assign_role → assign_admin_role()

-- Atualizar timestamps
update_*_updated_at → update_updated_at_column()

-- Contadores automáticos
trg_post_likes_inc → inc_likes_count()
trg_post_comments_inc → inc_comments_count()
trg_testimonial_likes → update_testimonial_likes_count()
```

---

## 🚀 Edge Functions

### Fluxo de Webhook (handle-purchase)

```
1. Kiwify/Hotmart envia webhook
   ↓
2. handle-purchase valida assinatura
   ↓
3. Converte product_id → ebook_id (product_mappings)
   ↓
4. Insere em pending_purchases
   ↓
5. Retorna 200 OK
```

### Fluxo de Resgate (claim-purchases)

```
1. Usuário faz login
   ↓
2. Frontend chama claim-purchases
   ↓
3. Busca pending_purchases por email
   ↓
4. Para cada compra:
   - Valida ebook existe
   - Verifica se já possui
   - Adiciona em user_ebooks
   - Concede XP e badges
   - Marca como claimed
   ↓
5. Retorna lista de ebooks resgatados
```

### Fluxo de Moderação (moderate-content)

```
1. Usuário posta conteúdo
   ↓
2. Frontend chama moderate-content
   ↓
3. Lovable AI analisa conteúdo
   ↓
4. Retorna score (0-1) e flags
   ↓
5. Se score >= 0.7: auto-aprovado
   Se score < 0.7: aguarda revisão manual
```

### Fluxo de Seed (seed-database)

```
1. Admin chama seed-database
   ↓
2. Cria 50 usuários fake
   ↓
3. Gera dados de gamificação
   ↓
4. Lovable AI cria:
   - Depoimentos realistas
   - Posts de comunidade
   - Comentários
   ↓
5. Popula estatísticas (últimos 30 dias)
```

---

## 📱 Frontend (React)

### Estrutura de Diretórios

```
src/
├── components/
│   ├── ui/                    # Shadcn components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── ebook/                 # Leitor de ebooks
│   │   ├── EbookViewer.tsx
│   │   └── ProgressTracker.tsx
│   ├── gamification/          # Sistema de gamificação
│   │   ├── XPDisplay.tsx
│   │   ├── BadgeCard.tsx
│   │   └── LeaderboardTable.tsx
│   └── community/             # Comunidade
│       ├── PostCard.tsx
│       └── CommentsList.tsx
├── pages/                     # Páginas (rotas)
│   ├── Index.tsx              # Home
│   ├── Library.tsx            # Biblioteca
│   ├── Reader.tsx             # Leitor
│   ├── Community.tsx          # Comunidade
│   └── Profile.tsx            # Perfil
├── lib/
│   ├── gamification/          # Lógica de gamificação
│   │   ├── xpCalculator.ts
│   │   └── levelSystem.ts
│   └── utils.ts
├── hooks/                     # Custom hooks
│   ├── useEbookProgress.ts
│   └── useGamification.ts
├── integrations/
│   └── supabase/
│       ├── client.ts          # Cliente Supabase
│       └── types.ts           # Tipos auto-gerados
└── App.tsx
```

### Fluxo de Dados (React Query)

```
Component
  ↓
useQuery / useMutation (TanStack Query)
  ↓
Supabase Client
  ↓
PostgreSQL / Edge Functions
```

Exemplo:
```typescript
// Hook customizado
export const useUserEbooks = () => {
  return useQuery({
    queryKey: ['user-ebooks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_ebooks')
        .select(`
          *,
          ebooks (
            id,
            title,
            cover_url,
            total_pages
          )
        `)
        .eq('user_id', userId);
      return data;
    },
  });
};

// Uso no componente
const { data: ebooks, isLoading } = useUserEbooks();
```

---

## 🎯 Fluxo de Gamificação

### Concessão de XP

```
Ação do Usuário (ler página, completar livro, etc.)
  ↓
Frontend registra ação
  ↓
INSERT em xp_transactions
  ↓
Trigger atualiza user_gamification.total_xp
  ↓
calculate_level(total_xp) → novo nível
  ↓
Se nível mudou: criar notificação
  ↓
Frontend recebe atualização (React Query invalidation)
  ↓
Animação de Level Up (Framer Motion)
```

### Conquista de Badge

```
Verificar critério (ex: 5 livros lidos)
  ↓
Se atingiu: INSERT em user_badges
  ↓
Criar notificação
  ↓
Conceder XP do badge
  ↓
Frontend mostra badge com animação
```

---

## 🔐 Sistema de Licenciamento

### Validação no Backend

```typescript
// Edge Function (validate_license)
const origin = req.headers.get('origin');  // Ex: https://cliente.com
const licenseKey = req.headers.get('x-license-key');

const { data: isValid } = await supabase.rpc('validate_license', {
  p_license_key: licenseKey,
  p_origin: origin
});

if (!isValid) {
  return 401 Unauthorized
}
```

### RPC Function

```sql
CREATE FUNCTION validate_license(p_license_key TEXT, p_origin TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_hostname TEXT;
  v_license RECORD;
BEGIN
  -- Extrair hostname (cliente.com)
  v_hostname := extract_hostname(p_origin);
  
  -- Buscar licença ativa
  SELECT * INTO v_license
  FROM licenses
  WHERE license_key = p_license_key
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW());
  
  -- Verificar se hostname está na lista
  IF v_hostname = ANY(v_license.allowed_domains) THEN
    -- Atualizar telemetria
    INSERT INTO license_usage (license_key, domain, last_check_at)
    VALUES (p_license_key, v_hostname, NOW())
    ON CONFLICT (license_key, domain) 
    DO UPDATE SET last_check_at = NOW();
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 Fluxo de Analytics

### Coleta de Eventos

```typescript
// Frontend
const trackEvent = async (eventName: string, metadata: any) => {
  await supabase.from('analytics_events').insert({
    user_id: userId,
    event_name: eventName,
    metadata: metadata,
  });
};

// Uso
trackEvent('ebook_opened', { ebook_id, page: 1 });
trackEvent('page_read', { ebook_id, page: 5, time_spent: 120 });
trackEvent('purchase_click', { ebook_id, source: 'library' });
```

### Visualização (Futuro)

Criar dashboard admin para ver:
- Ebooks mais lidos
- Taxa de conclusão
- Tempo médio de leitura
- Conversão de compras
- Usuários mais ativos

---

## 🚀 Deployment

### Frontend (Lovable)

```
1. Conectar GitHub
2. Push para main
3. Deploy automático
4. URL: seu-app.lovable.app
```

### Backend (Supabase)

```
Já está rodando!
- Database: provisioned
- Edge Functions: auto-deployed
- Storage: configurado
- Auth: habilitado
```

### Domínio Customizado

```
1. Adicionar CNAME em seu DNS:
   app.seudominio.com → seu-app.lovable.app

2. Configurar em Lovable:
   Settings → Domains → Add Custom Domain

3. Aguardar propagação (~24h)

4. ✅ Seu app em app.seudominio.com
```

---

## 🔧 Escalabilidade

### Supabase Free Tier

- 500 MB database
- 1 GB file storage
- 50,000 monthly active users
- 2 GB bandwidth

### Upgrade (quando necessário)

- Pro: $25/mês
  - 8 GB database
  - 100 GB storage
  - 100,000 MAU
  - 50 GB bandwidth

### Otimizações

1. **Índices**: Já criados para queries principais
2. **RLS**: Minimiza queries ao banco
3. **React Query**: Cache no frontend
4. **Edge Functions**: Auto-escalável
5. **CDN**: Supabase já usa CDN global

---

## 📚 Recursos Técnicos

- [Supabase Docs](https://supabase.com/docs)
- [React Router](https://reactrouter.com/)
- [TanStack Query](https://tanstack.com/query)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Vite](https://vitejs.dev/)

---

**Próximo**: [Customização →](CUSTOMIZATION.md)
