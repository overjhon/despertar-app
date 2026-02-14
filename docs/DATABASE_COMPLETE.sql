-- ===============================================
-- PLATAFORMA WHITELABEL DE EBOOKS
-- SQL Consolidado - Execute no SQL Editor do Supabase
-- ===============================================
-- 
-- INSTRUÇÕES:
-- 1. Copie TODO este arquivo (Ctrl+A, Ctrl+C)
-- 2. Abra o SQL Editor no Supabase
-- 3. Cole e execute (RUN ou F5)
-- 4. Aguarde ~30 segundos
-- 5. Verifique em "Table Editor" se as tabelas foram criadas
--
-- ===============================================

-- ===============================================
-- FASE 1: TIPOS E ENUMS
-- ===============================================

-- Enum para roles de usuário
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('user', 'admin', 'moderator');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ===============================================
-- FASE 2: TABELAS PRINCIPAIS
-- ===============================================

-- Tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  whatsapp TEXT,
  bio TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de roles dos usuários
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Tabela de ebooks
CREATE TABLE IF NOT EXISTS public.ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  author TEXT,
  cover_url TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  sample_pdf_url TEXT,
  purchase_url TEXT,
  category TEXT,
  tags TEXT[],
  total_pages INTEGER NOT NULL,
  estimated_reading_time INTEGER,
  original_price DECIMAL,
  current_price DECIMAL,
  discount_percentage INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de capítulos
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id UUID NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  start_page INTEGER NOT NULL,
  end_page INTEGER NOT NULL
);

-- Tabela de ebooks do usuário
CREATE TABLE IF NOT EXISTS public.user_ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ebook_id UUID REFERENCES public.ebooks(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ebook_id)
);

-- Tabela de progresso de leitura
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ebook_id UUID NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  current_page INTEGER DEFAULT 1,
  progress_percentage DECIMAL DEFAULT 0,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  reading_time_minutes INTEGER DEFAULT 0,
  UNIQUE(user_id, ebook_id)
);

-- ===============================================
-- FASE 3: GAMIFICAÇÃO
-- ===============================================

-- Tabela de gamificação do usuário
CREATE TABLE IF NOT EXISTS public.user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_read_date DATE,
  pages_read_today INTEGER DEFAULT 0,
  last_page_read_at TIMESTAMPTZ,
  total_pages_read INTEGER DEFAULT 0,
  total_reading_time_minutes INTEGER DEFAULT 0,
  books_completed INTEGER DEFAULT 0,
  best_daily_pages INTEGER DEFAULT 0,
  install_reward_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de transações de XP
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  related_ebook_id UUID REFERENCES public.ebooks(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de estatísticas diárias
CREATE TABLE IF NOT EXISTS public.daily_reading_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  pages_read INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 0,
  books_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Tabela de badges
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  criteria JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de badges do usuário
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Tabela de desafios
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  goal_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL,
  badge_reward_id UUID REFERENCES public.badges(id),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de desafios do usuário
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  current_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Tabela de recompensas
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  required_level INTEGER,
  required_xp INTEGER,
  required_badge_id UUID REFERENCES public.badges(id),
  badge_id UUID REFERENCES public.badges(id),
  ebook_id UUID REFERENCES public.ebooks(id),
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de recompensas do usuário
CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, reward_id)
);

-- ===============================================
-- FASE 4: COMUNIDADE
-- ===============================================

-- Tabela de follows
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Tabela de posts da comunidade
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'text',
  media_urls TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de likes em posts
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Tabela de comentários em posts
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de criações da comunidade
CREATE TABLE IF NOT EXISTS public.community_creations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ebook_id UUID REFERENCES public.ebooks(id),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  difficulty TEXT,
  ingredients JSONB,
  likes_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de likes em criações
CREATE TABLE IF NOT EXISTS public.creation_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creation_id UUID NOT NULL REFERENCES public.community_creations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creation_id, user_id)
);

-- ===============================================
-- FASE 5: DEPOIMENTOS E PERGUNTAS
-- ===============================================

-- Tabela de depoimentos
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ebook_id UUID NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de likes em depoimentos
CREATE TABLE IF NOT EXISTS public.testimonial_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id UUID NOT NULL REFERENCES public.testimonials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(testimonial_id, user_id)
);

-- Tabela de comentários em depoimentos
CREATE TABLE IF NOT EXISTS public.testimonial_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id UUID NOT NULL REFERENCES public.testimonials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de mídia de depoimentos
CREATE TABLE IF NOT EXISTS public.testimonial_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id UUID REFERENCES public.testimonials(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL,
  media_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de perguntas sobre ebooks
CREATE TABLE IF NOT EXISTS public.ebook_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id UUID NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  is_answered BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de respostas a perguntas
CREATE TABLE IF NOT EXISTS public.question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.ebook_questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_official BOOLEAN DEFAULT false,
  is_verified_purchaser BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- FASE 6: NOTIFICAÇÕES E MODERAÇÃO
-- ===============================================

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  metadata JSONB,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de moderação de conteúdo
CREATE TABLE IF NOT EXISTS public.content_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'testimonial')),
  content_id UUID NOT NULL,
  ai_score DECIMAL(3,2) CHECK (ai_score >= 0 AND ai_score <= 1),
  flags JSONB DEFAULT '[]'::jsonb,
  ai_analysis TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_approved')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de push subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  provider TEXT DEFAULT 'web',
  fcm_token TEXT,
  device_info JSONB,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de logs de entrega de push
CREATE TABLE IF NOT EXISTS public.push_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  message_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- FASE 7: COMPRAS E INDICAÇÕES
-- ===============================================

-- Tabela de mapeamento de produtos
CREATE TABLE IF NOT EXISTS public.product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT UNIQUE NOT NULL,
  ebook_id UUID NOT NULL REFERENCES public.ebooks(id),
  platform TEXT DEFAULT 'kiwify',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de compras pendentes
CREATE TABLE IF NOT EXISTS public.pending_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  transaction_id TEXT UNIQUE NOT NULL,
  ebook_id UUID,
  ebook_name TEXT,
  amount DECIMAL,
  paid_at TIMESTAMPTZ,
  offer_id TEXT,
  product_id TEXT,
  raw_payload JSONB,
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  claimed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de auditoria de compras pendentes
CREATE TABLE IF NOT EXISTS public.pending_purchases_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  pending_purchase_id UUID,
  user_id UUID,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  accessed_by UUID
);

-- Tabela de clicks de compra
CREATE TABLE IF NOT EXISTS public.purchase_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  ebook_id UUID REFERENCES public.ebooks(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de indicações
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  referred_email TEXT,
  referred_user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'expired')),
  conversion_date TIMESTAMPTZ,
  reward_type TEXT,
  reward_ebook_id UUID REFERENCES public.ebooks(id),
  reward_claimed BOOLEAN DEFAULT false,
  reward_claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ===============================================
-- FASE 8: RATE LIMITING E ANALYTICS
-- ===============================================

-- Tabela de rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  attempts INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier, action)
);

-- Tabela de eventos de analytics
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de atividade ao vivo
CREATE TABLE IF NOT EXISTS public.live_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id UUID NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  user_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de configurações do app
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- FASE 9: SISTEMA DE LICENCIAMENTO WHITELABEL
-- ===============================================

-- Tabela de licenças
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT UNIQUE NOT NULL,
  owner_email TEXT NOT NULL,
  owner_name TEXT,
  status TEXT DEFAULT 'active', -- active, suspended, expired
  allowed_domains TEXT[] DEFAULT '{}',
  max_users INTEGER,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de uso de licenças (telemetria)
CREATE TABLE IF NOT EXISTS public.license_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT NOT NULL,
  domain TEXT NOT NULL,
  user_count INTEGER DEFAULT 0,
  last_check_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(license_key, domain)
);

-- ===============================================
-- FASE 10: FUNÇÕES SQL
-- ===============================================

-- Função para calcular nível baseado em XP
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF xp < 500 THEN RETURN 1;
  ELSIF xp < 1500 THEN RETURN 2;
  ELSIF xp < 3500 THEN RETURN 3;
  ELSIF xp < 7000 THEN RETURN 4;
  ELSIF xp < 15000 THEN RETURN 5;
  ELSIF xp < 30000 THEN RETURN 6;
  ELSE RETURN 7;
  END IF;
END;
$$;

-- Função para obter nome do nível
CREATE OR REPLACE FUNCTION public.get_level_name(level INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE level
    WHEN 1 THEN RETURN 'Aprendiz';
    WHEN 2 THEN RETURN 'Leitor';
    WHEN 3 THEN RETURN 'Entusiasta';
    WHEN 4 THEN RETURN 'Conhecedor';
    WHEN 5 THEN RETURN 'Expert';
    WHEN 6 THEN RETURN 'Mestre';
    WHEN 7 THEN RETURN 'Lenda';
    ELSE RETURN 'Desconhecido';
  END CASE;
END;
$$;

-- Função para obter XP necessário para próximo nível
CREATE OR REPLACE FUNCTION public.get_xp_for_level(level INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE level
    WHEN 1 THEN RETURN 500;
    WHEN 2 THEN RETURN 1500;
    WHEN 3 THEN RETURN 3500;
    WHEN 4 THEN RETURN 7000;
    WHEN 5 THEN RETURN 15000;
    WHEN 6 THEN RETURN 30000;
    ELSE RETURN 30000;
  END CASE;
END;
$$;

-- Função para verificar se usuário tem role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para criar novo usuário (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Função para atribuir role admin ao email específico
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ⚠️ CUSTOMIZE: Substitua 'admin@example.com' pelo email do primeiro admin
  IF NEW.email = 'admin@example.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Função para sincronizar email do perfil
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles 
  SET email = NEW.email 
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Função para obter user_id por email
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = LOWER(TRIM(user_email));
  
  RETURN user_id;
END;
$$;

-- Função para obter ebook_id por product_id
CREATE OR REPLACE FUNCTION public.get_ebook_id_for_product(p_product_id TEXT)
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ebook_id 
  FROM product_mappings 
  WHERE product_id = p_product_id 
  AND platform = 'kiwify'
  LIMIT 1;
$$;

-- Função para criar notificação
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID, 
  p_type VARCHAR, 
  p_title VARCHAR, 
  p_message TEXT, 
  p_link VARCHAR DEFAULT NULL, 
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Função para gerar código de indicação
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    code := UPPER(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referral_code = code) INTO exists_code;
    EXIT WHEN NOT exists_code;
  END LOOP;
  RETURN code;
END;
$$;

-- Função para validar licença
CREATE OR REPLACE FUNCTION public.extract_hostname(p_origin TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hostname TEXT;
BEGIN
  v_hostname := regexp_replace(p_origin, '^https?://', '', 'i');
  v_hostname := regexp_replace(v_hostname, ':\d+$', '');
  v_hostname := split_part(v_hostname, '/', 1);
  RETURN lower(v_hostname);
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_license(p_license_key TEXT, p_origin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_license RECORD;
  v_hostname TEXT;
BEGIN
  v_hostname := extract_hostname(p_origin);
  
  SELECT * INTO v_license 
  FROM public.licenses 
  WHERE license_key = p_license_key 
  AND status = 'active'
  AND (expires_at IS NULL OR expires_at > NOW());
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  IF v_hostname = ANY(v_license.allowed_domains) THEN
    INSERT INTO public.license_usage (license_key, domain, last_check_at)
    VALUES (p_license_key, v_hostname, NOW())
    ON CONFLICT (license_key, domain) 
    DO UPDATE SET last_check_at = NOW();
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Função atômica para adicionar XP
CREATE OR REPLACE FUNCTION public.add_xp_atomic(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_related_ebook_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(new_xp INTEGER, new_level INTEGER, level_up BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current RECORD;
  v_new_xp INTEGER;
  v_old_level INTEGER;
  v_new_level INTEGER;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid XP amount';
  END IF;

  SELECT * INTO v_current
  FROM public.user_gamification
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.user_gamification(user_id)
    VALUES (p_user_id);
    SELECT * INTO v_current
    FROM public.user_gamification
    WHERE user_id = p_user_id
    FOR UPDATE;
  END IF;

  v_new_xp := v_current.total_xp + p_amount;
  v_old_level := v_current.current_level;
  v_new_level := public.calculate_level(v_new_xp);

  UPDATE public.user_gamification
  SET total_xp = v_new_xp,
      current_level = v_new_level,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO public.xp_transactions(user_id, xp_amount, reason, related_ebook_id, metadata)
  VALUES (p_user_id, p_amount, p_reason, p_related_ebook_id, p_metadata);

  RETURN QUERY SELECT v_new_xp, v_new_level, (v_new_level > v_old_level);
END;
$$;

-- Função para incrementar estatísticas diárias
CREATE OR REPLACE FUNCTION public.increment_daily_stats(
  p_user_id UUID,
  p_date DATE,
  p_pages_delta INTEGER,
  p_xp_delta INTEGER,
  p_books_delta INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.daily_reading_stats (user_id, date, pages_read, xp_earned, books_completed)
  VALUES (p_user_id, p_date, GREATEST(0, p_pages_delta), GREATEST(0, p_xp_delta), GREATEST(0, p_books_delta))
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    pages_read = public.daily_reading_stats.pages_read + GREATEST(0, EXCLUDED.pages_read),
    xp_earned = public.daily_reading_stats.xp_earned + GREATEST(0, EXCLUDED.xp_earned),
    books_completed = public.daily_reading_stats.books_completed + GREATEST(0, EXCLUDED.books_completed);
END;
$$;

-- Função de rate limiting
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT, 
  p_action TEXT, 
  p_max_attempts INTEGER, 
  p_window_minutes INTEGER, 
  p_block_minutes INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ := v_now - (p_window_minutes || ' minutes')::INTERVAL;
BEGIN
  SELECT * INTO v_record
  FROM public.rate_limit_attempts
  WHERE identifier = p_identifier AND action = p_action
  FOR UPDATE;

  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > v_now THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'remaining_seconds', EXTRACT(EPOCH FROM (v_record.blocked_until - v_now))::INTEGER,
      'attempts_left', 0
    );
  END IF;

  IF v_record.window_start IS NULL OR v_record.window_start < v_window_start THEN
    UPDATE public.rate_limit_attempts
    SET attempts = 1,
        window_start = v_now,
        blocked_until = NULL,
        updated_at = v_now
    WHERE identifier = p_identifier AND action = p_action;
    
    RETURN jsonb_build_object(
      'allowed', true,
      'blocked', false,
      'attempts_left', p_max_attempts - 1
    );
  END IF;

  IF v_record.attempts >= p_max_attempts THEN
    UPDATE public.rate_limit_attempts
    SET blocked_until = v_now + (p_block_minutes || ' minutes')::INTERVAL,
        updated_at = v_now
    WHERE identifier = p_identifier AND action = p_action;
    
    RETURN jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'remaining_seconds', p_block_minutes * 60,
      'attempts_left', 0
    );
  END IF;

  UPDATE public.rate_limit_attempts
  SET attempts = attempts + 1,
      updated_at = v_now
  WHERE identifier = p_identifier AND action = p_action;

  RETURN jsonb_build_object(
    'allowed', true,
    'blocked', false,
    'attempts_left', p_max_attempts - (v_record.attempts + 1)
  );

EXCEPTION
  WHEN NO_DATA_FOUND THEN
    INSERT INTO public.rate_limit_attempts (identifier, action, attempts, window_start)
    VALUES (p_identifier, p_action, 1, v_now);
    
    RETURN jsonb_build_object(
      'allowed', true,
      'blocked', false,
      'attempts_left', p_max_attempts - 1
    );
END;
$$;

-- Funções para incrementar/decrementar contadores
CREATE OR REPLACE FUNCTION public.inc_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.community_posts
  SET comments_count = comments_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.dec_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.community_posts
  SET comments_count = GREATEST(comments_count - 1, 0)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.inc_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.community_posts
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.dec_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.community_posts
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

-- ===============================================
-- FASE 11: TRIGGERS
-- ===============================================

-- Trigger para novo usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atribuir role
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_role();

-- Trigger para sincronizar email
DROP TRIGGER IF EXISTS on_auth_user_updated_email ON auth.users;
CREATE TRIGGER on_auth_user_updated_email
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email();

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ebooks_updated_at ON public.ebooks;
CREATE TRIGGER update_ebooks_updated_at
  BEFORE UPDATE ON public.ebooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para contadores de posts
DROP TRIGGER IF EXISTS trg_post_comments_inc ON public.post_comments;
CREATE TRIGGER trg_post_comments_inc
  AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.inc_comments_count();

DROP TRIGGER IF EXISTS trg_post_comments_dec ON public.post_comments;
CREATE TRIGGER trg_post_comments_dec
  AFTER DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.dec_comments_count();

DROP TRIGGER IF EXISTS trg_post_likes_inc ON public.post_likes;
CREATE TRIGGER trg_post_likes_inc
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.inc_likes_count();

DROP TRIGGER IF EXISTS trg_post_likes_dec ON public.post_likes;
CREATE TRIGGER trg_post_likes_dec
  AFTER DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.dec_likes_count();

-- ===============================================
-- FASE 12: VIEWS
-- ===============================================

-- View pública de perfis (sem dados sensíveis)
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  p.bio,
  p.created_at
FROM public.profiles p;

-- ===============================================
-- FASE 13: ENABLE RLS
-- ===============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reading_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_creations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creation_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonial_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonial_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonial_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_purchases_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_usage ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- FASE 14: RLS POLICIES
-- ===============================================

-- Profiles
CREATE POLICY "Users can view own complete profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Authenticated users can view limited profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- User Roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Ebooks
CREATE POLICY "Authenticated users can view active ebooks" ON public.ebooks FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all ebooks" ON public.ebooks FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert ebooks" ON public.ebooks FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update ebooks" ON public.ebooks FOR UPDATE USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete ebooks" ON public.ebooks FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Chapters
CREATE POLICY "Anyone can view chapters" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Admins can insert chapters" ON public.chapters FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update chapters" ON public.chapters FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete chapters" ON public.chapters FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- User Ebooks
CREATE POLICY "Users can view own ebooks" ON public.user_ebooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert user ebooks" ON public.user_ebooks FOR INSERT TO service_role WITH CHECK (true);

-- User Progress
CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

-- User Gamification
CREATE POLICY "Users can view own gamification data" ON public.user_gamification FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gamification data" ON public.user_gamification FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gamification data" ON public.user_gamification FOR UPDATE USING (auth.uid() = user_id);

-- XP Transactions
CREATE POLICY "Users can view own xp transactions" ON public.xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp transactions" ON public.xp_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily Reading Stats
CREATE POLICY "Users can view own daily stats" ON public.daily_reading_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily stats" ON public.daily_reading_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily stats" ON public.daily_reading_stats FOR UPDATE USING (auth.uid() = user_id);

-- Badges
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admins can insert badges" ON public.badges FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update badges" ON public.badges FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete badges" ON public.badges FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- User Badges
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Challenges
CREATE POLICY "Admins can view all challenges" ON public.challenges FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert challenges" ON public.challenges FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update challenges" ON public.challenges FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete challenges" ON public.challenges FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- User Challenges
CREATE POLICY "Users can view own challenges" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenges" ON public.user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenges" ON public.user_challenges FOR UPDATE USING (auth.uid() = user_id);

-- Rewards
CREATE POLICY "Anyone can view active rewards" ON public.rewards FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all rewards" ON public.rewards FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert rewards" ON public.rewards FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update rewards" ON public.rewards FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete rewards" ON public.rewards FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- User Rewards
CREATE POLICY "Users can view own rewards" ON public.user_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rewards" ON public.user_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Follows
CREATE POLICY "Authenticated users can view follows" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users can manage own follows" ON public.user_follows FOR ALL USING (auth.uid() = follower_id) WITH CHECK (auth.uid() = follower_id);

-- Community Posts
CREATE POLICY "Authenticated users can view public posts" ON public.community_posts FOR SELECT USING (is_public = true);
CREATE POLICY "Usuárias podem criar seus próprios posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuárias podem atualizar seus próprios posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuárias podem deletar seus próprios posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

-- Post Likes
CREATE POLICY "Authenticated users can view likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Usuárias podem adicionar suas próprias curtidas" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuárias podem remover suas próprias curtidas" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- Post Comments
CREATE POLICY "Todos podem ver comentários" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Usuárias podem criar seus próprios comentários" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuárias podem atualizar seus próprios comentários" ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuárias podem deletar seus próprios comentários" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- Community Creations
CREATE POLICY "Anyone can view public creations" ON public.community_creations FOR SELECT USING (true);
CREATE POLICY "Users can insert own creations" ON public.community_creations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own creations" ON public.community_creations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own creations" ON public.community_creations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all creations" ON public.community_creations FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Creation Likes
CREATE POLICY "Anyone can view creation likes" ON public.creation_likes FOR SELECT USING (true);
CREATE POLICY "Users can like creations" ON public.creation_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike creations" ON public.creation_likes FOR DELETE USING (auth.uid() = user_id);

-- Testimonials
CREATE POLICY "Public testimonials are viewable by everyone" ON public.testimonials FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own testimonials" ON public.testimonials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own testimonials" ON public.testimonials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own testimonials" ON public.testimonials FOR DELETE USING (auth.uid() = user_id);

-- Testimonial Likes
CREATE POLICY "Anyone can view likes" ON public.testimonial_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON public.testimonial_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.testimonial_likes FOR DELETE USING (auth.uid() = user_id);

-- Testimonial Comments
CREATE POLICY "Anyone can view comments" ON public.testimonial_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert own comments" ON public.testimonial_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.testimonial_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.testimonial_comments FOR DELETE USING (auth.uid() = user_id);

-- Testimonial Media
CREATE POLICY "Anyone can view testimonial media" ON public.testimonial_media FOR SELECT USING (true);
CREATE POLICY "Users can insert media to own testimonials" ON public.testimonial_media FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM testimonials WHERE id = testimonial_media.testimonial_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own testimonial media" ON public.testimonial_media FOR DELETE 
  USING (EXISTS (SELECT 1 FROM testimonials WHERE id = testimonial_media.testimonial_id AND user_id = auth.uid()));

-- Ebook Questions
CREATE POLICY "Authenticated users can view questions" ON public.ebook_questions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can ask questions" ON public.ebook_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own questions" ON public.ebook_questions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own questions" ON public.ebook_questions FOR DELETE USING (auth.uid() = user_id);

-- Question Answers
CREATE POLICY "Anyone can view answers" ON public.question_answers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can answer questions" ON public.question_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own answers" ON public.question_answers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own answers" ON public.question_answers FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all answers" ON public.question_answers FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Content Moderation
CREATE POLICY "Admins can view all moderation" ON public.content_moderation FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update moderation" ON public.content_moderation FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert moderation" ON public.content_moderation FOR INSERT WITH CHECK (true);

-- Push Subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.push_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Push Delivery Logs
CREATE POLICY "Admins can view all push logs" ON public.push_delivery_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert push logs" ON public.push_delivery_logs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Product Mappings
CREATE POLICY "Only admins can read product mappings" ON public.product_mappings FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage product mappings" ON public.product_mappings FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Pending Purchases
CREATE POLICY "Backend only access" ON public.pending_purchases FOR ALL USING (false) WITH CHECK (false);

-- Pending Purchases Audit
CREATE POLICY "Only admins can view audit logs" ON public.pending_purchases_audit FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Purchase Clicks
CREATE POLICY "Users can view own clicks" ON public.purchase_clicks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can track own clicks" ON public.purchase_clicks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referrals
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);
CREATE POLICY "Users can insert own referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);
CREATE POLICY "System can update referrals" ON public.referrals FOR UPDATE USING (true);
CREATE POLICY "Admins can manage referrals" ON public.referrals FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Rate Limit Attempts
CREATE POLICY "System can manage rate limits" ON public.rate_limit_attempts FOR ALL USING (true) WITH CHECK (true);

-- Analytics Events
CREATE POLICY "Users can view their own analytics" ON public.analytics_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own analytics" ON public.analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all analytics" ON public.analytics_events FOR SELECT 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Live Activity
CREATE POLICY "Authenticated users can view live activity" ON public.live_activity FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can insert live activity" ON public.live_activity FOR INSERT WITH CHECK (true);

-- App Settings
CREATE POLICY "Admins can view app settings" ON public.app_settings FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert app settings" ON public.app_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update app settings" ON public.app_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Licenses
CREATE POLICY "Admins can manage licenses" ON public.licenses FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- License Usage
CREATE POLICY "Admins can view license usage" ON public.license_usage FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ===============================================
-- FASE 15: ÍNDICES PARA PERFORMANCE
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON public.user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_total_xp ON public.user_gamification(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_user_ebooks_user_id ON public.user_ebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_ebook_id ON public.testimonials(ebook_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON public.daily_reading_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_licenses_key ON public.licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_license_usage_key ON public.license_usage(license_key);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_fcm_token ON public.push_subscriptions(fcm_token);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);

-- ===============================================
-- FASE 16: DADOS INICIAIS (BADGES)
-- ===============================================

-- Inserir badges básicos
INSERT INTO public.badges (name, description, icon, category, xp_reward, criteria) VALUES
  ('Primeira Leitura', 'Leu seu primeiro ebook', '📖', 'reading', 50, '{"action": "first_read"}'),
  ('Investidora', 'Comprou seu primeiro ebook', '💎', 'purchase', 100, '{"action": "first_purchase"}'),
  ('Maratonista', 'Completou 5 ebooks', '🏃‍♀️', 'reading', 300, '{"action": "complete_books", "count": 5}'),
  ('Chama de 7 dias', 'Manteve sequência de 7 dias', '🔥', 'streak', 150, '{"action": "streak", "days": 7}'),
  ('Chama de 30 dias', 'Manteve sequência de 30 dias', '🔥🔥', 'streak', 500, '{"action": "streak", "days": 30}'),
  ('Colecionadora', 'Comprou 3 ebooks', '📚', 'purchase', 300, '{"action": "purchase_count", "count": 3}'),
  ('Expert Leitor', 'Alcançou o nível 7', '👑', 'level', 1000, '{"action": "reach_level", "level": 7}'),
  ('Instalador', 'Instalou o app no dispositivo', '📱', 'special', 100, '{"action": "install_app"}'),
  ('Social', 'Fez seu primeiro post na comunidade', '💬', 'community', 50, '{"action": "first_post"}'),
  ('Criador', 'Compartilhou sua primeira criação', '✨', 'community', 100, '{"action": "first_creation"}')
ON CONFLICT DO NOTHING;

-- ===============================================
-- ✅ BANCO DE DADOS CONFIGURADO COM SUCESSO!
-- ===============================================
--
-- Próximos passos:
-- 1. Criar storage buckets (ver STORAGE_SETUP.md)
-- 2. Criar Edge Functions (ver EDGE_FUNCTIONS_SETUP.md)
-- 3. Configurar secrets
-- 4. Conectar ao Lovable
--
-- ===============================================
