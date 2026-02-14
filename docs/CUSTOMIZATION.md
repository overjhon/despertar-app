# 🎨 Guia de Customização

Este guia mostra como personalizar o template para seu cliente/marca.

---

## 🏷️ Branding Básico

### 1. Nome e Descrição

Edite `.env`:
```env
VITE_BRAND_NAME="Meu App de Ebooks"
VITE_DEFAULT_DESCRIPTION="Plataforma completa de ebooks com gamificação"
VITE_PWA_DESCRIPTION="Leia, aprenda e ganhe recompensas"
```

### 2. Imagens

Substitua em `public/`:
- `og-image.jpg` (1200x630px) - Compartilhamento social
- `favicon.ico` (32x32px) - Ícone do navegador
- `logo.png` (512x512px) - Logo da marca (opcional)

---

## 🎨 Cores e Tema

### Cores Primárias

Edite `src/index.css`:

```css
:root {
  /* Cor principal da marca */
  --primary: 346 77% 49%;        /* Rosa/Vermelho */
  --primary-foreground: 0 0% 100%;

  /* Cor secundária */
  --secondary: 240 5% 96%;
  --secondary-foreground: 240 6% 10%;

  /* Cor de destaque */
  --accent: 346 77% 49%;
  --accent-foreground: 0 0% 100%;
}
```

**Dica**: Use [HSL Color Picker](https://hslpicker.com/) para converter cores.

### Modo Escuro

```css
.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  
  --primary: 346 77% 49%;
  --primary-foreground: 0 0% 100%;
  
  /* ... ajuste conforme necessário */
}
```

### Gradientes

Para criar gradientes personalizados:

```css
:root {
  --gradient-hero: linear-gradient(135deg, hsl(var(--primary)), hsl(346 90% 65%));
  --gradient-card: linear-gradient(180deg, hsl(var(--background)), hsl(var(--secondary)));
}
```

Use em componentes:
```tsx
<div className="bg-[var(--gradient-hero)]">
  Hero Section
</div>
```

---

## 🏆 Gamificação

### Níveis

Edite `supabase/migrations/...` (ou crie nova migration):

```sql
CREATE OR REPLACE FUNCTION public.calculate_level(xp integer)
RETURNS integer AS $$
BEGIN
  -- Personalize os requisitos de XP
  IF xp < 1000 THEN RETURN 1;      -- Ajuste: era 500
  ELSIF xp < 3000 THEN RETURN 2;   -- Ajuste: era 1500
  ELSIF xp < 7000 THEN RETURN 3;
  ELSIF xp < 15000 THEN RETURN 4;
  ELSIF xp < 30000 THEN RETURN 5;
  ELSIF xp < 50000 THEN RETURN 6;  -- Novo nível!
  ELSE RETURN 7;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_level_name(level integer)
RETURNS text AS $$
BEGIN
  CASE level
    WHEN 1 THEN RETURN 'Iniciante';       -- Personalize os nomes
    WHEN 2 THEN RETURN 'Explorador';
    WHEN 3 THEN RETURN 'Aventureiro';
    WHEN 4 THEN RETURN 'Especialista';
    WHEN 5 THEN RETURN 'Mestre';
    WHEN 6 THEN RETURN 'Lendário';
    WHEN 7 THEN RETURN 'Mítico';
    ELSE RETURN 'Desconhecido';
  END CASE;
END;
$$ LANGUAGE plpgsql;
```

### Badges Customizados

Adicione novos badges no SQL:

```sql
INSERT INTO badges (name, description, icon, category, xp_reward, criteria) VALUES
  (
    'Madrugador', 
    'Leu às 6h da manhã', 
    '🌅', 
    'special', 
    50,
    '{"type": "read_time", "hour": 6}'
  ),
  (
    'Leitor Noturno',
    'Leu às 22h',
    '🌙',
    'special',
    50,
    '{"type": "read_time", "hour": 22}'
  );
```

### Recompensas de XP

Ajuste em `src/lib/gamification/xpRewards.ts`:

```typescript
export const XP_REWARDS = {
  // Leitura
  PAGE_READ: 2,           // XP por página (ajuste: era 1)
  CHAPTER_COMPLETE: 50,   // XP por capítulo
  BOOK_COMPLETE: 500,     // XP por livro completo
  
  // Comunidade
  POST_CREATE: 20,        // Criar post
  COMMENT_CREATE: 10,     // Comentar
  LIKE_RECEIVED: 5,       // Receber curtida
  
  // Compras
  FIRST_PURCHASE: 1000,   // Primeira compra (era 500)
  PURCHASE: 300,          // Compras subsequentes
  
  // Especiais
  DAILY_STREAK_7: 200,    // 7 dias seguidos
  DAILY_STREAK_30: 1000,  // 30 dias seguidos
};
```

---

## 📚 Categorias de Ebooks

### Adicionar Novas Categorias

No frontend, edite `src/lib/constants/categories.ts`:

```typescript
export const EBOOK_CATEGORIES = [
  'Velas',           // Categorias originais
  'Receitas',
  'Negócios',
  'Terapêutico',
  'Sazonais',
  
  // Suas novas categorias:
  'Artesanato',
  'Decoração',
  'Marketing',
  'Empreendedorismo',
] as const;
```

### Personalizar Ícones por Categoria

Edite componente de card de ebook:

```typescript
const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    'Velas': '🕯️',
    'Receitas': '📖',
    'Artesanato': '✂️',    // Novo
    'Decoração': '🎨',      // Novo
    'Marketing': '📊',      // Novo
  };
  return icons[category] || '📚';
};
```

---

## 🎯 Desafios

### Criar Novos Desafios

```sql
INSERT INTO challenges (
  name,
  description,
  type,
  goal_type,
  goal_value,
  xp_reward,
  start_date,
  end_date
) VALUES (
  'Maratona de Leitura',
  'Leia 10 ebooks em 30 dias',
  'limited',
  'books_read',
  10,
  2000,
  NOW(),
  NOW() + INTERVAL '30 days'
);
```

Tipos de desafios:
- `daily` - Diário
- `weekly` - Semanal
- `monthly` - Mensal
- `limited` - Tempo limitado
- `permanent` - Permanente

Goal types:
- `pages_read` - Páginas lidas
- `books_read` - Livros lidos
- `books_completed` - Livros completados
- `reading_time` - Tempo de leitura (minutos)
- `streak_days` - Dias consecutivos

---

## 🎨 Componentes UI

### Botões

Personalize em `src/components/ui/button.tsx`:

```typescript
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // Adicione novos estilos:
        gradient: "bg-gradient-to-r from-primary to-accent text-white",
        glass: "bg-white/10 backdrop-blur-md border border-white/20",
      },
    }
  }
);
```

Uso:
```tsx
<Button variant="gradient">Meu Botão</Button>
<Button variant="glass">Efeito Vidro</Button>
```

### Cards

Crie variantes de card personalizadas:

```tsx
// Em src/components/ui/card.tsx
const cardVariants = cva("...", {
  variants: {
    variant: {
      default: "bg-card text-card-foreground",
      elevated: "bg-card shadow-xl hover:shadow-2xl transition-shadow",
      gradient: "bg-gradient-to-br from-primary/10 to-accent/10",
    }
  }
});
```

---

## 🌐 Textos e Traduções

### Mensagens do Sistema

Crie `src/lib/constants/messages.ts`:

```typescript
export const MESSAGES = {
  welcome: "Bem-vindo(a) ao {appName}!",
  firstLogin: "É ótimo ter você aqui!",
  levelUp: "Parabéns! Você alcançou o nível {level}!",
  badgeEarned: "Você conquistou: {badgeName}!",
  
  // Personalize conforme necessário
  bookCompleted: "Incrível! Você terminou o livro!",
  streakMilestone: "🔥 {days} dias de sequência!",
};

// Uso no código:
import { MESSAGES } from '@/lib/constants/messages';
const message = MESSAGES.welcome.replace('{appName}', brandName);
```

### Idiomas (Futuro)

Para suportar múltiplos idiomas, considere usar:
- `react-i18next`
- Arquivo `locales/pt-BR.json`, `locales/en-US.json`, etc.

---

## 📱 PWA (Progressive Web App)

### Personalizar Manifesto

Edite `vite.config.ts`:

```typescript
VitePWA({
  manifest: {
    name: 'Meu App de Ebooks',                    // Nome completo
    short_name: 'MeuApp',                         // Nome curto
    description: 'Plataforma de ebooks com gamificação',
    theme_color: '#E02449',                       // Cor do tema (use sua primary)
    background_color: '#ffffff',
    icons: [
      {
        src: '/logo-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/logo-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  }
})
```

Crie os ícones:
- `public/logo-192.png` (192x192px)
- `public/logo-512.png` (512x512px)

---

## 🔒 Licenciamento Whitelabel

### Criar Primeira Licença

No SQL Editor:

```sql
INSERT INTO licenses (
  license_key,
  owner_email,
  owner_name,
  allowed_domains,
  status,
  max_users
) VALUES (
  'SEU-LICENSE-KEY-AQUI',              -- Gere um UUID ou string única
  'cliente@email.com',
  'Nome do Cliente',
  ARRAY['seudominio.com', 'www.seudominio.com'],  -- Domínios permitidos
  'active',
  NULL                                  -- NULL = ilimitado
);
```

**Importante**: Cada cliente precisa de uma licença única!

### Validar Licença no Frontend

Em `src/App.tsx` ou componente raiz:

```typescript
import { supabase } from '@/integrations/supabase/client';

const validateLicense = async () => {
  const licenseKey = import.meta.env.VITE_LICENSE_KEY;
  const origin = window.location.origin;
  
  const { data: isValid } = await supabase.rpc('validate_license', {
    p_license_key: licenseKey,
    p_origin: origin
  });
  
  if (!isValid) {
    // Mostrar erro ou redirecionar
    console.error('Licença inválida!');
  }
};
```

---

## 🎭 Animações

### Configurar Framer Motion

Já incluído no projeto. Exemplos de uso:

```tsx
import { motion } from 'framer-motion';

// Fade in ao carregar
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Conteúdo
</motion.div>

// Hover effect
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Clique aqui
</motion.button>

// Stagger children
<motion.div
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }}
  initial="hidden"
  animate="show"
>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 }
      }}
    >
      {item.title}
    </motion.div>
  ))}
</motion.div>
```

---

## 📊 Analytics

### Adicionar Google Analytics

1. Instale: `npm install react-ga4`

2. Configure em `src/App.tsx`:

```typescript
import ReactGA from 'react-ga4';

// Inicializar
ReactGA.initialize('G-XXXXXXXXXX'); // Seu Tracking ID

// Rastrear pageviews
useEffect(() => {
  ReactGA.send({ hitType: 'pageview', page: window.location.pathname });
}, [location]);

// Rastrear eventos customizados
const handleButtonClick = () => {
  ReactGA.event({
    category: 'User',
    action: 'Clicked Button',
    label: 'Buy Ebook'
  });
};
```

---

## 🚀 Performance

### Lazy Loading de Páginas

```typescript
// Ao invés de:
import EbookReader from './pages/EbookReader';

// Use:
const EbookReader = lazy(() => import('./pages/EbookReader'));

// Envolva em Suspense:
<Suspense fallback={<LoadingSpinner />}>
  <EbookReader />
</Suspense>
```

### Otimizar Imagens

Use `<img loading="lazy" />` para carregar sob demanda:

```tsx
<img 
  src={cover} 
  alt={title}
  loading="lazy"  // Lazy load automático
  className="..."
/>
```

---

## 🎯 Próximos Passos

1. ✅ Personalize cores e branding
2. ✅ Ajuste sistema de XP e níveis
3. ✅ Crie badges e desafios customizados
4. ✅ Configure analytics
5. ✅ Teste em diferentes dispositivos
6. ✅ Publique para seu cliente!

---

## 📚 Recursos Adicionais

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Supabase Docs](https://supabase.com/docs)
- [React Router Docs](https://reactrouter.com/)
