-- Consolidated SQL Schema Export
-- Source: supabase/migrations
-- Generated: 2025-11-17T16:41:38.8487529-03:00
-- NOTE: This file aggregates all migration files in lexical order.
-- It includes tables, indexes, policies, grants and RPC functions.


-- ========================
-- File: 00000000000000_complete_schema.sql
-- ========================

-- =====================================================
-- MIGRAÃ‡ÃƒO COMPLETA - MUNDO DELAS
-- Data: 2025-10-28
-- =====================================================

-- =====================================================
-- PARTE 1: TIPOS CUSTOMIZADOS
-- =====================================================

CREATE TYPE app_role AS ENUM ('user', 'admin', 'moderator');

-- =====================================================
-- PARTE 2: TABELAS DE AUTENTICAÃ‡ÃƒO E PERFIS
-- =====================================================

-- Tabela: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name varchar NOT NULL,
  email text,
  avatar_url text,
  bio text,
  whatsapp varchar,
  onboarding_completed boolean DEFAULT false,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Tabela: user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- View: public_profiles
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  created_at
FROM profiles;

-- =====================================================
-- PARTE 3: E-BOOKS E CONTEÃšDO
-- =====================================================

-- Tabela: ebooks
CREATE TABLE IF NOT EXISTS public.ebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar NOT NULL,
  subtitle text,
  author varchar,
  description text,
  cover_url text NOT NULL,
  pdf_url text NOT NULL,
  sample_pdf_url text,
  category varchar,
  tags text[],
  total_pages integer NOT NULL,
  estimated_reading_time integer,
  original_price numeric,
  current_price numeric,
  discount_percentage integer,
  purchase_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ebooks_category ON ebooks(category);
CREATE INDEX IF NOT EXISTS idx_ebooks_is_active ON ebooks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ebooks_created_at ON ebooks(created_at DESC);

-- Tabela: chapters
CREATE TABLE IF NOT EXISTS public.chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id uuid NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL,
  title varchar(255) NOT NULL,
  start_page integer NOT NULL,
  end_page integer NOT NULL,
  UNIQUE(ebook_id, chapter_number)
);

CREATE INDEX IF NOT EXISTS idx_chapters_ebook_id ON chapters(ebook_id);

-- Tabela: user_ebooks
CREATE TABLE IF NOT EXISTS public.user_ebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ebook_id uuid NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  purchased_at timestamptz DEFAULT now(),
  UNIQUE(user_id, ebook_id)
);

CREATE INDEX IF NOT EXISTS idx_user_ebooks_user_id ON user_ebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ebooks_ebook_id ON user_ebooks(ebook_id);

-- Tabela: user_progress
CREATE TABLE IF NOT EXISTS public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ebook_id uuid NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  current_page integer DEFAULT 1,
  progress_percentage numeric DEFAULT 0,
  reading_time_minutes integer DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  last_read_at timestamptz DEFAULT now(),
  UNIQUE(user_id, ebook_id)
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_ebook ON user_progress(user_id, ebook_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(completed);

-- Tabela: ebook_questions
CREATE TABLE IF NOT EXISTS public.ebook_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id uuid NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  question text NOT NULL,
  is_answered boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ebook_questions_ebook_id ON ebook_questions(ebook_id);
CREATE INDEX IF NOT EXISTS idx_ebook_questions_user_id ON ebook_questions(user_id);

-- =====================================================
-- PARTE 4: GAMIFICAÃ‡ÃƒO
-- =====================================================

-- Tabela: user_gamification
CREATE TABLE IF NOT EXISTS public.user_gamification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp integer DEFAULT 0 NOT NULL,
  current_level integer DEFAULT 1 NOT NULL,
  current_streak_days integer DEFAULT 0 NOT NULL,
  longest_streak_days integer DEFAULT 0 NOT NULL,
  pages_read_today integer DEFAULT 0 NOT NULL,
  last_page_read_at timestamptz,
  last_read_date date,
  total_pages_read integer DEFAULT 0,
  total_reading_time_minutes integer DEFAULT 0,
  books_completed integer DEFAULT 0,
  best_daily_pages integer DEFAULT 0,
  install_reward_claimed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_total_xp ON user_gamification(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_gamification_level ON user_gamification(current_level DESC);

-- Tabela: badges
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category varchar NOT NULL,
  xp_reward integer DEFAULT 0 NOT NULL,
  criteria jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela: user_badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at DESC);

-- Tabela: challenges
CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  description text NOT NULL,
  type varchar NOT NULL,
  goal_type varchar NOT NULL,
  goal_value integer NOT NULL,
  xp_reward integer NOT NULL,
  badge_reward_id uuid REFERENCES badges(id),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela: user_challenges
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  current_progress integer DEFAULT 0 NOT NULL,
  completed boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  claimed boolean DEFAULT false NOT NULL,
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_completed ON user_challenges(completed);

-- Tabela: daily_reading_stats
CREATE TABLE IF NOT EXISTS public.daily_reading_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE NOT NULL,
  pages_read integer DEFAULT 0,
  reading_time_minutes integer DEFAULT 0,
  xp_earned integer DEFAULT 0,
  books_completed integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_reading_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_reading_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_pages ON daily_reading_stats(pages_read DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_xp ON daily_reading_stats(xp_earned DESC);

-- Tabela: rewards
CREATE TABLE IF NOT EXISTS public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  description text NOT NULL,
  type varchar NOT NULL,
  ebook_id uuid REFERENCES ebooks(id),
  badge_id uuid REFERENCES badges(id),
  required_level integer,
  required_xp integer,
  required_badge_id uuid REFERENCES badges(id),
  metadata jsonb,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela: user_rewards
CREATE TABLE IF NOT EXISTS public.user_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  claimed_at timestamptz DEFAULT now()
);

-- =====================================================
-- PARTE 5: COMUNIDADE SOCIAL
-- =====================================================

-- Tabela: community_posts
CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  post_type varchar DEFAULT 'text' NOT NULL,
  media_urls text[],
  likes_count integer DEFAULT 0 NOT NULL,
  comments_count integer DEFAULT 0 NOT NULL,
  is_public boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_public ON community_posts(is_public) WHERE is_public = true;

-- Tabela: post_likes
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Tabela: post_comments
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela: community_creations
CREATE TABLE IF NOT EXISTS public.community_creations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ebook_id uuid REFERENCES ebooks(id),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  difficulty text,
  ingredients jsonb,
  likes_count integer DEFAULT 0 NOT NULL,
  saves_count integer DEFAULT 0 NOT NULL,
  is_featured boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela: creation_likes
CREATE TABLE IF NOT EXISTS public.creation_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creation_id uuid NOT NULL REFERENCES community_creations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(creation_id, user_id)
);

-- Tabela: user_follows
CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Tabela: live_activity
CREATE TABLE IF NOT EXISTS public.live_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id uuid NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  user_location text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_activity_created_at ON live_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_activity_ebook_id ON live_activity(ebook_id);

-- =====================================================
-- PARTE 6: AVALIAÃ‡Ã•ES E DEPOIMENTOS
-- =====================================================

-- Tabela: testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ebook_id uuid NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  title varchar NOT NULL,
  content text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  likes_count integer DEFAULT 0 NOT NULL,
  comments_count integer DEFAULT 0 NOT NULL,
  is_public boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_ebook_id ON testimonials(ebook_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_user_id ON testimonials(user_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_rating ON testimonials(rating DESC);

-- Tabela: testimonial_media
CREATE TABLE IF NOT EXISTS public.testimonial_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id uuid REFERENCES testimonials(id) ON DELETE CASCADE,
  media_type text NOT NULL,
  media_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela: testimonial_likes
CREATE TABLE IF NOT EXISTS public.testimonial_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id uuid NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(testimonial_id, user_id)
);

-- Tabela: testimonial_comments
CREATE TABLE IF NOT EXISTS public.testimonial_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id uuid NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela: question_answers
CREATE TABLE IF NOT EXISTS public.question_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES ebook_questions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  answer text NOT NULL,
  is_official boolean DEFAULT false NOT NULL,
  is_verified_purchaser boolean DEFAULT false NOT NULL,
  helpful_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- PARTE 7: COMPRAS E REFERRALS
-- =====================================================

-- Tabela: pending_purchases
CREATE TABLE IF NOT EXISTS public.pending_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  transaction_id text NOT NULL UNIQUE,
  product_id text,
  offer_id text,
  ebook_id uuid REFERENCES ebooks(id),
  ebook_name text,
  amount numeric,
  paid_at timestamptz,
  claimed boolean DEFAULT false,
  claimed_at timestamptz,
  claimed_by uuid REFERENCES profiles(id),
  raw_payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_purchases_email ON pending_purchases(email);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_claimed ON pending_purchases(claimed);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_transaction_id ON pending_purchases(transaction_id);

-- Tabela: pending_purchases_audit
CREATE TABLE IF NOT EXISTS public.pending_purchases_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  pending_purchase_id uuid,
  user_id uuid,
  accessed_by uuid,
  accessed_at timestamptz DEFAULT now()
);

-- Tabela: product_mappings
CREATE TABLE IF NOT EXISTS public.product_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text DEFAULT 'kiwify' NOT NULL,
  product_id text NOT NULL,
  ebook_id uuid NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(platform, product_id)
);

-- Tabela: purchase_clicks
CREATE TABLE IF NOT EXISTS public.purchase_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  ebook_id uuid REFERENCES ebooks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_clicks_user_id ON purchase_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_clicks_ebook_id ON purchase_clicks(ebook_id);
CREATE INDEX IF NOT EXISTS idx_purchase_clicks_created_at ON purchase_clicks(created_at DESC);

-- Tabela: referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code text NOT NULL UNIQUE,
  referred_email text,
  referred_user_id uuid REFERENCES profiles(id),
  status text DEFAULT 'pending' NOT NULL,
  conversion_date timestamptz,
  reward_type text,
  reward_ebook_id uuid REFERENCES ebooks(id),
  reward_claimed boolean DEFAULT false,
  reward_claimed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- =====================================================
-- PARTE 8: MODERAÃ‡ÃƒO E SEGURANÃ‡A
-- =====================================================

-- Tabela: content_moderation
CREATE TABLE IF NOT EXISTS public.content_moderation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  flags jsonb DEFAULT '[]'::jsonb,
  ai_analysis text,
  ai_score numeric,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_moderation_content ON content_moderation(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_status ON content_moderation(status);

-- Tabela: rate_limit_attempts
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action text NOT NULL,
  attempts integer DEFAULT 1 NOT NULL,
  window_start timestamptz DEFAULT now() NOT NULL,
  blocked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(identifier, action)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_action ON rate_limit_attempts(identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limit_blocked_until ON rate_limit_attempts(blocked_until);

-- =====================================================
-- PARTE 9: SISTEMA E INFRAESTRUTURA
-- =====================================================

-- Tabela: analytics_events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Tabela: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type varchar NOT NULL,
  title varchar NOT NULL,
  message text NOT NULL,
  link varchar,
  metadata jsonb,
  read boolean DEFAULT false NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Tabela: push_subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Script completo criado com sucesso!
-- Para continuar, execute o prÃ³ximo arquivo: 00000000000001_functions.sql



-- ========================
-- File: 00000000000001_functions.sql
-- ========================

-- =====================================================
-- MIGRAÃ‡ÃƒO: FunÃ§Ãµes Auxiliares e Triggers
-- =====================================================

-- FunÃ§Ã£o: has_role
CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- FunÃ§Ã£o: calculate_level
CREATE OR REPLACE FUNCTION calculate_level(xp integer)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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

-- FunÃ§Ã£o: get_level_name
CREATE OR REPLACE FUNCTION get_level_name(level integer)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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

-- FunÃ§Ã£o: get_xp_for_level
CREATE OR REPLACE FUNCTION get_xp_for_level(level integer)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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

-- FunÃ§Ã£o: generate_referral_code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- FunÃ§Ã£o: create_notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type varchar,
  p_title varchar,
  p_message text,
  p_link varchar DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_metadata)
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$;

-- FunÃ§Ã£o: check_rate_limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier text,
  p_action text,
  p_max_attempts integer,
  p_window_minutes integer,
  p_block_minutes integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_record RECORD;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_window_start TIMESTAMP WITH TIME ZONE := v_now - (p_window_minutes || ' minutes')::INTERVAL;
BEGIN
  SELECT * INTO v_record
  FROM public.rate_limit_attempts
  WHERE identifier = p_identifier AND action = p_action
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.rate_limit_attempts (identifier, action, attempts, window_start)
    VALUES (p_identifier, p_action, 1, v_now);

    RETURN jsonb_build_object(
      'allowed', true,
      'blocked', false,
      'attempts_left', p_max_attempts - 1
    );
  END IF;

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
END;
$$;

-- Triggers para contadores automÃ¡ticos

-- Trigger: Atualizar likes em posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_post_likes_count_on_insert ON post_likes;
CREATE TRIGGER update_post_likes_count_on_insert
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

DROP TRIGGER IF EXISTS update_post_likes_count_on_delete ON post_likes;
CREATE TRIGGER update_post_likes_count_on_delete
  AFTER DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- Trigger: Atualizar comentÃ¡rios em posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_post_comments_count_on_insert ON post_comments;
CREATE TRIGGER update_post_comments_count_on_insert
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

DROP TRIGGER IF EXISTS update_post_comments_count_on_delete ON post_comments;
CREATE TRIGGER update_post_comments_count_on_delete
  AFTER DELETE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- Trigger: Criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'UsuÃ¡rio'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- âœ… FunÃ§Ãµes e Triggers criados com sucesso!



-- ========================
-- File: 20251016130723_e8acb54a-8cb2-4e82-bd00-68fa7245c9d3.sql
-- ========================

-- Create users profile table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  whatsapp VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  onboarding_completed BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create ebooks table
CREATE TABLE IF NOT EXISTS public.ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  description TEXT,
  author VARCHAR(255),
  cover_url TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  total_pages INT NOT NULL,
  estimated_reading_time INT,
  category VARCHAR(100),
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;

-- RLS Policy - all authenticated users can read ebooks
CREATE POLICY "Authenticated users can view active ebooks"
  ON public.ebooks FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create user_ebooks (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.user_ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ebook_id UUID REFERENCES public.ebooks(id) ON DELETE CASCADE NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ebook_id)
);

-- Enable RLS
ALTER TABLE public.user_ebooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_ebooks
CREATE POLICY "Users can view own ebooks"
  ON public.user_ebooks FOR SELECT
  USING (auth.uid() = user_id);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ebook_id UUID REFERENCES public.ebooks(id) ON DELETE CASCADE NOT NULL,
  current_page INT DEFAULT 1,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  reading_time_minutes INT DEFAULT 0,
  UNIQUE(user_id, ebook_id)
);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_progress
CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Create chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id UUID REFERENCES public.ebooks(id) ON DELETE CASCADE NOT NULL,
  chapter_number INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  start_page INT NOT NULL,
  end_page INT NOT NULL,
  UNIQUE(ebook_id, chapter_number)
);

-- Enable RLS
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Authenticated users can view chapters"
  ON public.chapters FOR SELECT
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for ebooks
CREATE TRIGGER update_ebooks_updated_at
  BEFORE UPDATE ON public.ebooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================
-- File: 20251016132454_778c9cb9-b0f8-41f7-9cc6-6f1619963663.sql
-- ========================

-- Add sample_pdf_url column to ebooks table
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS sample_pdf_url TEXT;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('ebooks', 'ebooks', false, 52428800, ARRAY['application/pdf']),
  ('covers', 'covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('samples', 'samples', true, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policy for ebooks bucket: only users who purchased can download
CREATE POLICY "Users can download purchased ebooks"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ebooks' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_ebooks ue
    WHERE ue.user_id = auth.uid()
    AND ue.ebook_id::text = (storage.foldername(name))[1]
  )
);

-- RLS Policy for covers bucket: public read
CREATE POLICY "Public can view covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

-- RLS Policy for samples bucket: public read
CREATE POLICY "Public can view samples"
ON storage.objects FOR SELECT
USING (bucket_id = 'samples');

-- Insert ebooks data
INSERT INTO public.ebooks (id, title, subtitle, description, author, category, cover_url, pdf_url, sample_pdf_url, total_pages, estimated_reading_time, tags, is_active)
VALUES 
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    '50 Receitas Exclusivas de Velas Gourmet',
    'Transforme sua casa em uma fÃ¡brica de aromas irresistÃ­veis',
    'Descubra 50 receitas Ãºnicas e testadas de velas gourmet que encantam pelo aroma e visual. Aprenda tÃ©cnicas profissionais de aromatizaÃ§Ã£o, coloraÃ§Ã£o e acabamento para criar velas que se destacam no mercado.',
    'Equipe Velas Artesanais',
    'Receitas',
    'covers/50-receitas-cover.jpg',
    'ebooks/f47ac10b-58cc-4372-a567-0e02b2c3d479/50-Receitas-Exclusivas-de-Velas-Gourmet.pdf',
    'samples/50-receitas-sample.pdf',
    32,
    45,
    ARRAY['velas', 'receitas', 'gourmet', 'aromatizaÃ§Ã£o', 'artesanato'],
    true
  ),
  (
    '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    'Velas que Vendem',
    'EstratÃ©gias comprovadas para transformar sua produÃ§Ã£o em lucro',
    'O guia completo para quem quer vender velas com sucesso. Aprenda precificaÃ§Ã£o estratÃ©gica, posicionamento de mercado, tÃ©cnicas de vendas online e offline, e como criar uma marca que os clientes amam.',
    'Equipe Velas Artesanais',
    'NegÃ³cios',
    'covers/velas-que-vendem-cover.jpg',
    'ebooks/7c9e6679-7425-40de-944b-e07fc1f90ae7/Velas-que-Vendem.pdf',
    'samples/velas-que-vendem-sample.pdf',
    45,
    60,
    ARRAY['velas', 'vendas', 'marketing', 'precificaÃ§Ã£o', 'negÃ³cio'],
    true
  ),
  (
    '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    'Velas TerapÃªuticas',
    'A Linha Funcional Que Fatura 3x Mais',
    'Descubra o mercado em expansÃ£o das velas terapÃªuticas. Aprenda a criar velas com propriedades relaxantes, energizantes e terapÃªuticas usando Ã³leos essenciais, cristais e tÃ©cnicas de aromaterapia. Um nicho lucrativo e em alta.',
    'Equipe Velas Artesanais',
    'TerapÃªutico',
    'covers/velas-terapeuticas-cover.jpg',
    'ebooks/3fa85f64-5717-4562-b3fc-2c963f66afa6/Velas-Terapeuticas-A-Linha-Funcional-Que-Fatura-3x-Mais.pdf',
    'samples/velas-terapeuticas-sample.pdf',
    38,
    50,
    ARRAY['velas', 'terapÃªuticas', 'aromaterapia', 'Ã³leos essenciais', 'cristais'],
    true
  ),
  (
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    'Velas Sazonais',
    'Lucre com as datas comemorativas e estaÃ§Ãµes do ano',
    'Aprenda a criar coleÃ§Ãµes sazonais que explodem em vendas. Descubra tÃ©cnicas exclusivas para velas de Natal, PÃ¡scoa, Dia das MÃ£es, festas juninas e muito mais. Planeje seu calendÃ¡rio anual de lanÃ§amentos e maximize seus lucros.',
    'Equipe Velas Artesanais',
    'Sazonais',
    'covers/velas-sazonais-cover.jpg',
    'ebooks/6ba7b810-9dad-11d1-80b4-00c04fd430c8/Velas_Sazonais_compressed.pdf',
    'samples/velas-sazonais-sample.pdf',
    28,
    40,
    ARRAY['velas', 'sazonais', 'datas comemorativas', 'coleÃ§Ãµes', 'vendas'],
    true
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  author = EXCLUDED.author,
  category = EXCLUDED.category,
  cover_url = EXCLUDED.cover_url,
  pdf_url = EXCLUDED.pdf_url,
  sample_pdf_url = EXCLUDED.sample_pdf_url,
  total_pages = EXCLUDED.total_pages,
  estimated_reading_time = EXCLUDED.estimated_reading_time,
  tags = EXCLUDED.tags,
  is_active = EXCLUDED.is_active;

-- ========================
-- File: 20251016134119_ad89e007-d315-46e9-92e5-485e3e4da5fb.sql
-- ========================

-- PolÃ­tica para ADMIN fazer upload no bucket 'ebooks'
CREATE POLICY "Admin can upload to ebooks"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ebooks'
);

-- PolÃ­tica para ADMIN fazer upload no bucket 'covers'
CREATE POLICY "Admin can upload to covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'covers'
);

-- PolÃ­tica para ADMIN fazer upload no bucket 'samples'
CREATE POLICY "Admin can upload to samples"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'samples'
);

-- PolÃ­tica para ADMIN atualizar arquivos
CREATE POLICY "Admin can update files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('ebooks', 'covers', 'samples')
)
WITH CHECK (
  bucket_id IN ('ebooks', 'covers', 'samples')
);

-- PolÃ­tica para ADMIN deletar arquivos
CREATE POLICY "Admin can delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('ebooks', 'covers', 'samples')
);

-- ========================
-- File: 20251016135728_2998404f-790c-4f5f-9636-6db15eab8df8.sql
-- ========================

-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Criar tabela user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- FunÃ§Ã£o security definer para verificar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- PolÃ­ticas RLS para user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger para atribuir role admin ao email especÃ­fico
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
    -- Outros usuários recebem role 'user' por padrão
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger para atribuir roles automaticamente
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_role();

-- Atualizar polÃ­ticas RLS dos buckets de storage para admin
DROP POLICY IF EXISTS "Admin can upload to ebooks" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload to covers" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload to samples" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update files" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete files" ON storage.objects;

-- Novas polÃ­ticas baseadas em role admin
CREATE POLICY "Admin can upload to ebooks"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ebooks' AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can upload to covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can upload to samples"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'samples' AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can update files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('ebooks', 'covers', 'samples') AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id IN ('ebooks', 'covers', 'samples') AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('ebooks', 'covers', 'samples') AND public.has_role(auth.uid(), 'admin')
);

-- ========================
-- File: 20251016154439_f2b3421c-2839-4e98-bc8b-ebc24622aed9.sql
-- ========================

-- Create enum for app roles if not exists (already exists based on context)

-- Create user_gamification table
CREATE TABLE IF NOT EXISTS public.user_gamification (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_xp integer NOT NULL DEFAULT 0,
  current_level integer NOT NULL DEFAULT 1,
  current_streak_days integer NOT NULL DEFAULT 0,
  longest_streak_days integer NOT NULL DEFAULT 0,
  last_read_date date,
  pages_read_today integer NOT NULL DEFAULT 0,
  last_page_read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name character varying NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category character varying NOT NULL CHECK (category IN ('reading', 'community', 'special')),
  xp_reward integer NOT NULL DEFAULT 0,
  criteria jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create xp_transactions table
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_amount integer NOT NULL,
  reason character varying NOT NULL,
  related_ebook_id uuid REFERENCES public.ebooks(id) ON DELETE SET NULL,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_gamification
CREATE POLICY "Users can view own gamification data"
  ON public.user_gamification FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gamification data"
  ON public.user_gamification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification data"
  ON public.user_gamification FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for badges (public read)
CREATE POLICY "Anyone can view badges"
  ON public.badges FOR SELECT
  USING (true);

-- RLS Policies for user_badges
CREATE POLICY "Users can view own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for xp_transactions
CREATE POLICY "Users can view own xp transactions"
  ON public.xp_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xp transactions"
  ON public.xp_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to calculate level from XP
CREATE OR REPLACE FUNCTION public.calculate_level(xp integer)
RETURNS integer
LANGUAGE plpgsql
STABLE
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

-- Create function to get level name
CREATE OR REPLACE FUNCTION public.get_level_name(level integer)
RETURNS text
LANGUAGE plpgsql
STABLE
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

-- Create function to get XP needed for next level
CREATE OR REPLACE FUNCTION public.get_xp_for_level(level integer)
RETURNS integer
LANGUAGE plpgsql
STABLE
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

-- Create trigger to update updated_at
CREATE TRIGGER update_user_gamification_updated_at
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial badges
INSERT INTO public.badges (name, description, icon, category, xp_reward, criteria) VALUES
('Primeiro Passo', 'Complete seu primeiro ebook', 'ðŸ“š', 'reading', 100, '{"type": "ebooks_completed", "count": 1}'),
('Leitor Dedicado', 'Complete 5 ebooks', 'ðŸ“–', 'reading', 250, '{"type": "ebooks_completed", "count": 5}'),
('Mestre dos Livros', 'Complete 10 ebooks', 'ðŸ†', 'reading', 500, '{"type": "ebooks_completed", "count": 10}'),
('Streak 7', 'Leia por 7 dias consecutivos', 'ðŸ”¥', 'reading', 200, '{"type": "streak_days", "count": 7}'),
('Streak 30', 'Leia por 30 dias consecutivos', 'â­', 'reading', 500, '{"type": "streak_days", "count": 30}'),
('Maratonista', 'Leia 100 pÃ¡ginas em um dia', 'âš¡', 'reading', 300, '{"type": "pages_in_day", "count": 100}'),
('Explorador', 'Leia ebooks de 3 categorias diferentes', 'ðŸŒ', 'reading', 250, '{"type": "categories", "count": 3}'),
('Velocista', 'Complete um ebook em menos de 48 horas', 'ðŸš€', 'reading', 300, '{"type": "completion_time_hours", "max": 48}'),
('Night Owl', 'Leia apÃ³s 22h (10 vezes)', 'ðŸŒ™', 'special', 150, '{"type": "reading_time", "after": "22:00", "count": 10}'),
('Early Bird', 'Leia antes das 7h (10 vezes)', 'â˜€ï¸', 'special', 150, '{"type": "reading_time", "before": "07:00", "count": 10}')
ON CONFLICT DO NOTHING;

-- ========================
-- File: 20251016154541_d2234aba-f6fc-4a39-b50e-3366737b8104.sql
-- ========================

-- Fix function search_path for security
DROP FUNCTION IF EXISTS public.calculate_level(integer);
CREATE OR REPLACE FUNCTION public.calculate_level(xp integer)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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

DROP FUNCTION IF EXISTS public.get_level_name(integer);
CREATE OR REPLACE FUNCTION public.get_level_name(level integer)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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

DROP FUNCTION IF EXISTS public.get_xp_for_level(integer);
CREATE OR REPLACE FUNCTION public.get_xp_for_level(level integer)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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

-- ========================
-- File: 20251016155052_a84f55be-cf0b-436b-b8c7-18122ae9c785.sql
-- ========================

-- Create testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ebook_id uuid NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title character varying NOT NULL,
  content text NOT NULL,
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, ebook_id)
);

-- Create testimonial_likes table
CREATE TABLE IF NOT EXISTS public.testimonial_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  testimonial_id uuid NOT NULL REFERENCES public.testimonials(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(testimonial_id, user_id)
);

-- Create testimonial_comments table
CREATE TABLE IF NOT EXISTS public.testimonial_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  testimonial_id uuid NOT NULL REFERENCES public.testimonials(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_follows table
CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonial_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonial_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for testimonials
CREATE POLICY "Public testimonials are viewable by everyone"
  ON public.testimonials FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert own testimonials"
  ON public.testimonials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own testimonials"
  ON public.testimonials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own testimonials"
  ON public.testimonials FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for testimonial_likes
CREATE POLICY "Anyone can view likes"
  ON public.testimonial_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON public.testimonial_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.testimonial_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for testimonial_comments
CREATE POLICY "Anyone can view comments"
  ON public.testimonial_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON public.testimonial_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.testimonial_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.testimonial_comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_follows
CREATE POLICY "Anyone can view follows"
  ON public.user_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own follows"
  ON public.user_follows FOR ALL
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

-- Triggers for updated_at
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_testimonial_comments_updated_at
  BEFORE UPDATE ON public.testimonial_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update likes count
CREATE OR REPLACE FUNCTION public.update_testimonial_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.testimonials
    SET likes_count = likes_count + 1
    WHERE id = NEW.testimonial_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.testimonials
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.testimonial_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Function to update comments count
CREATE OR REPLACE FUNCTION public.update_testimonial_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.testimonials
    SET comments_count = comments_count + 1
    WHERE id = NEW.testimonial_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.testimonials
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.testimonial_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Triggers for counts
CREATE TRIGGER testimonial_likes_count_trigger
  AFTER INSERT OR DELETE ON public.testimonial_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_testimonial_likes_count();

CREATE TRIGGER testimonial_comments_count_trigger
  AFTER INSERT OR DELETE ON public.testimonial_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_testimonial_comments_count();

-- ========================
-- File: 20251016155419_f1c6ff04-987c-46e9-a810-eb0bc0095d57.sql
-- ========================

-- Add community badges
INSERT INTO public.badges (name, description, icon, category, xp_reward, criteria) VALUES
('Comunicador', 'Poste 10 depoimentos', 'ðŸ’¬', 'community', 250, '{"type": "testimonials_posted", "count": 10}'),
('Influenciador', 'Receba 100 curtidas totais', 'â­', 'community', 500, '{"type": "total_likes_received", "count": 100}')
ON CONFLICT DO NOTHING;

-- ========================
-- File: 20251016160034_ca6b50d4-8d55-408b-bbb0-17d974dae0ba.sql
-- ========================

-- Create challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name character varying NOT NULL,
  description text NOT NULL,
  type character varying NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'special')),
  goal_type character varying NOT NULL CHECK (goal_type IN ('pages_read', 'ebooks_completed', 'streak_days', 'testimonials_posted', 'likes_received')),
  goal_value integer NOT NULL,
  xp_reward integer NOT NULL,
  badge_reward_id uuid REFERENCES public.badges(id) ON DELETE SET NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_challenges table (tracks user progress on challenges)
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  current_progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  claimed boolean NOT NULL DEFAULT false,
  claimed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type character varying NOT NULL CHECK (type IN ('level_up', 'badge_earned', 'challenge_completed', 'challenge_new', 'follow', 'like', 'comment', 'system')),
  title character varying NOT NULL,
  message text NOT NULL,
  link character varying,
  read boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS public.rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name character varying NOT NULL,
  description text NOT NULL,
  type character varying NOT NULL CHECK (type IN ('ebook_unlock', 'badge_exclusive', 'xp_boost', 'custom')),
  required_level integer,
  required_xp integer,
  required_badge_id uuid REFERENCES public.badges(id) ON DELETE SET NULL,
  ebook_id uuid REFERENCES public.ebooks(id) ON DELETE SET NULL,
  badge_id uuid REFERENCES public.badges(id) ON DELETE SET NULL,
  metadata jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_rewards table
CREATE TABLE IF NOT EXISTS public.user_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  claimed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, reward_id)
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges (public read, active only)
CREATE POLICY "Anyone can view active challenges"
  ON public.challenges FOR SELECT
  USING (is_active = true);

-- RLS Policies for user_challenges
CREATE POLICY "Users can view own challenges"
  ON public.user_challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges"
  ON public.user_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges"
  ON public.user_challenges FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for rewards (public read, active only)
CREATE POLICY "Anyone can view active rewards"
  ON public.rewards FOR SELECT
  USING (is_active = true);

-- RLS Policies for user_rewards
CREATE POLICY "Users can view own rewards"
  ON public.user_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards"
  ON public.user_rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_user_challenges_updated_at
  BEFORE UPDATE ON public.user_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type character varying,
  p_title character varying,
  p_message text,
  p_link character varying DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Insert initial weekly challenges
INSERT INTO public.challenges (name, description, type, goal_type, goal_value, xp_reward, start_date, end_date) VALUES
('Leitor Semanal', 'Leia 100 pÃ¡ginas esta semana', 'weekly', 'pages_read', 100, 300, NOW(), NOW() + INTERVAL '7 days'),
('Maratonista Semanal', 'Complete 2 ebooks esta semana', 'weekly', 'ebooks_completed', 2, 500, NOW(), NOW() + INTERVAL '7 days'),
('SequÃªncia de Ouro', 'Mantenha uma sequÃªncia de 7 dias', 'weekly', 'streak_days', 7, 400, NOW(), NOW() + INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ========================
-- File: 20251016164401_4a33f138-ad8b-45fc-81a1-72ed07813897.sql
-- ========================

-- Add bio field to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create storage bucket for avatars if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Make profiles viewable by everyone (for public profiles)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Anyone can view profiles"
ON public.profiles FOR SELECT
USING (true);

-- ========================
-- File: 20251016170338_bad7cfd7-8888-4a3e-8702-e42179c75f34.sql
-- ========================

-- Criar tabela de posts da comunidade
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type VARCHAR(20) NOT NULL DEFAULT 'text',
  media_urls TEXT[],
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar Ã­ndices para performance
CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_posts_public ON public.community_posts(is_public) WHERE is_public = true;

-- Criar tabela de curtidas em posts
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON public.post_likes(user_id);

-- Criar tabela de comentÃ¡rios em posts
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX idx_post_comments_created_at ON public.post_comments(created_at);

-- Habilitar RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies para community_posts
CREATE POLICY "Todos podem ver posts pÃºblicos"
ON public.community_posts
FOR SELECT
USING (is_public = true);

CREATE POLICY "UsuÃ¡rias podem criar seus prÃ³prios posts"
ON public.community_posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "UsuÃ¡rias podem atualizar seus prÃ³prios posts"
ON public.community_posts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "UsuÃ¡rias podem deletar seus prÃ³prios posts"
ON public.community_posts
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies para post_likes
CREATE POLICY "Todos podem ver curtidas"
ON public.post_likes
FOR SELECT
USING (true);

CREATE POLICY "UsuÃ¡rias podem adicionar suas prÃ³prias curtidas"
ON public.post_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "UsuÃ¡rias podem remover suas prÃ³prias curtidas"
ON public.post_likes
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies para post_comments
CREATE POLICY "Todos podem ver comentÃ¡rios"
ON public.post_comments
FOR SELECT
USING (true);

CREATE POLICY "UsuÃ¡rias podem criar seus prÃ³prios comentÃ¡rios"
ON public.post_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "UsuÃ¡rias podem atualizar seus prÃ³prios comentÃ¡rios"
ON public.post_comments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "UsuÃ¡rias podem deletar seus prÃ³prios comentÃ¡rios"
ON public.post_comments
FOR DELETE
USING (auth.uid() = user_id);

-- FunÃ§Ã£o para atualizar contador de curtidas
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger para atualizar contador de curtidas
CREATE TRIGGER update_post_likes_count_trigger
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_likes_count();

-- FunÃ§Ã£o para atualizar contador de comentÃ¡rios
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger para atualizar contador de comentÃ¡rios
CREATE TRIGGER update_post_comments_count_trigger
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_post_comments_count();

-- Trigger para atualizar updated_at em posts
CREATE TRIGGER update_community_posts_updated_at
BEFORE UPDATE ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at em comentÃ¡rios
CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar storage bucket para mÃ­dia da comunidade
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-media',
  'community-media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
);

-- RLS policies para storage bucket community-media
CREATE POLICY "Imagens da comunidade sÃ£o pÃºblicas"
ON storage.objects
FOR SELECT
USING (bucket_id = 'community-media');

CREATE POLICY "UsuÃ¡rias autenticadas podem fazer upload"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'community-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "UsuÃ¡rias podem atualizar seus prÃ³prios arquivos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "UsuÃ¡rias podem deletar seus prÃ³prios arquivos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ========================
-- File: 20251016172325_385bc037-1a57-4f14-ba43-5dfda6fa287e.sql
-- ========================

-- Add price columns to ebooks table
ALTER TABLE ebooks
ADD COLUMN IF NOT EXISTS purchase_url TEXT,
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS current_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER;

-- Update existing ebooks with purchase data
-- Velas que Vendem
UPDATE ebooks 
SET 
  purchase_url = 'https://pay.cakto.com.br/3fsvrq2_608236',
  original_price = 67.00,
  current_price = 37.00,
  discount_percentage = 45
WHERE id = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

-- Velas TerapÃªuticas
UPDATE ebooks 
SET 
  purchase_url = 'https://pay.cakto.com.br/hpgcp3n_609900',
  original_price = 39.90,
  current_price = 19.90,
  discount_percentage = 50
WHERE id = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

-- Velas Sazonais
UPDATE ebooks 
SET 
  purchase_url = 'https://pay.cakto.com.br/yk4zc92_609798',
  original_price = 49.90,
  current_price = 19.90,
  discount_percentage = 60
WHERE id = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

-- 50 Receitas Gourmet
UPDATE ebooks 
SET 
  purchase_url = 'https://pay.cakto.com.br/qozn9ip_609893',
  original_price = 57.00,
  current_price = 19.90,
  discount_percentage = 65
WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- Create table for tracking purchase clicks
CREATE TABLE IF NOT EXISTS purchase_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on purchase_clicks
ALTER TABLE purchase_clicks ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Users can track own clicks" ON purchase_clicks;
DROP POLICY IF EXISTS "Users can view own clicks" ON purchase_clicks;

-- Users can insert their own clicks
CREATE POLICY "Users can track own clicks"
ON purchase_clicks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view own clicks
CREATE POLICY "Users can view own clicks"
ON purchase_clicks
FOR SELECT
USING (auth.uid() = user_id);

-- Create purchase badges with proper UUIDs
INSERT INTO badges (id, name, description, icon, category, xp_reward, criteria)
VALUES
  (gen_random_uuid(), 'Investidora', 'Comprou seu primeiro ebook', 'ðŸ’Ž', 'special', 100, '{"type": "purchase_count", "value": 1}'),
  (gen_random_uuid(), 'Colecionadora', 'Comprou 3 ebooks', 'ðŸ“š', 'special', 300, '{"type": "purchase_count", "value": 3}'),
  (gen_random_uuid(), 'Mestra das Velas', 'Completou a coleÃ§Ã£o (4 ebooks)', 'ðŸ‘‘', 'special', 500, '{"type": "purchase_count", "value": 4}')
ON CONFLICT DO NOTHING;

-- ========================
-- File: 20251016181603_c9a81331-48e4-416f-a885-d6a2bc9afa97.sql
-- ========================

-- Adicionar coluna email na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Popular com dados existentes do auth.users
UPDATE profiles p
SET email = (
  SELECT email FROM auth.users WHERE id = p.id
)
WHERE email IS NULL;

-- Criar Ã­ndice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Criar funÃ§Ã£o RPC para buscar user_id por email
CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = LOWER(TRIM(user_email));
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para manter email sincronizado quando usuÃ¡rio atualiza
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET email = NEW.email 
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION sync_profile_email();

-- ========================
-- File: 20251016181710_09c0a5c0-cb4c-4970-9d4a-087b8225397d.sql
-- ========================

-- Corrigir search_path na funÃ§Ã£o get_user_id_by_email
CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = LOWER(TRIM(user_email));
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ========================
-- File: 20251016182556_35048fc1-706d-4b56-8fe3-516359e91b57.sql
-- ========================

-- Criar tabela de compras pendentes
CREATE TABLE public.pending_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  offer_id TEXT,
  product_id TEXT,
  ebook_id UUID,
  ebook_name TEXT,
  amount NUMERIC,
  transaction_id TEXT UNIQUE NOT NULL,
  paid_at TIMESTAMPTZ,
  raw_payload JSONB,
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  claimed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar Ã­ndices para performance
CREATE INDEX idx_pending_purchases_email ON public.pending_purchases(email);
CREATE INDEX idx_pending_purchases_transaction ON public.pending_purchases(transaction_id);
CREATE INDEX idx_pending_purchases_claimed ON public.pending_purchases(claimed, email);

-- Habilitar RLS
ALTER TABLE public.pending_purchases ENABLE ROW LEVEL SECURITY;

-- PolÃ­tica deny-all (apenas backend via service role)
CREATE POLICY "Backend only access"
ON public.pending_purchases
FOR ALL
USING (false)
WITH CHECK (false);

-- ========================
-- File: 20251016183909_2444541b-328d-4e94-8e60-4166ef20ce2e.sql
-- ========================

-- Add RLS policies for admins to manage ebooks
CREATE POLICY "Admins can insert ebooks"
ON public.ebooks
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ebooks"
ON public.ebooks
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ebooks"
ON public.ebooks
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ========================
-- File: 20251016184325_286cb02b-9947-47e4-9d01-674fe88e20f0.sql
-- ========================

-- Storage policies to allow admins to manage files in private 'ebooks' bucket

-- Allow admins to upload (INSERT) into ebooks bucket
CREATE POLICY "Admins can upload to ebooks bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ebooks'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update objects in ebooks bucket
CREATE POLICY "Admins can update ebooks bucket objects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ebooks' AND public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'ebooks' AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete objects in ebooks bucket
CREATE POLICY "Admins can delete ebooks bucket objects"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ebooks' AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Optional: allow admins to list/view objects in ebooks bucket
CREATE POLICY "Admins can view ebooks bucket objects"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ebooks' AND public.has_role(auth.uid(), 'admin'::app_role)
);


-- ========================
-- File: 20251016184815_ce0f6555-9711-4542-ad8e-158ed28acf0d.sql
-- ========================

-- Corrigir pending_purchases para referenciar o ID correto do ebook
UPDATE pending_purchases
SET ebook_id = '308cf18e-2ea8-4241-adc2-da8582bec253'
WHERE ebook_id = '346f79a0-9139-4ab2-b00b-06003194cb09'
  AND claimed = false;

-- Deletar o ebook duplicado antigo
DELETE FROM ebooks 
WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- ========================
-- File: 20251016194223_d9c9a2df-dc7a-44e2-8e7a-aa87220dcffc.sql
-- ========================

-- Adicionar novas colunas na tabela user_gamification
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS total_pages_read INTEGER DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS total_reading_time_minutes INTEGER DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS books_completed INTEGER DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS best_daily_pages INTEGER DEFAULT 0;

-- Criar tabela de estatÃ­sticas diÃ¡rias
CREATE TABLE IF NOT EXISTS daily_reading_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  pages_read INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 0,
  books_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Habilitar RLS
ALTER TABLE daily_reading_stats ENABLE ROW LEVEL SECURITY;

-- PolÃ­ticas RLS para daily_reading_stats
CREATE POLICY "Users can view own daily stats"
ON daily_reading_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily stats"
ON daily_reading_stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily stats"
ON daily_reading_stats FOR UPDATE
USING (auth.uid() = user_id);

-- Ãndices para performance
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_reading_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_reading_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_pages ON daily_reading_stats(pages_read DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_xp ON daily_reading_stats(xp_earned DESC);

-- Ãndices adicionais em user_gamification para rankings
CREATE INDEX IF NOT EXISTS idx_gamification_total_pages ON user_gamification(total_pages_read DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_reading_time ON user_gamification(total_reading_time_minutes DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_books_completed ON user_gamification(books_completed DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_best_daily ON user_gamification(best_daily_pages DESC);

-- ========================
-- File: 20251016195859_008dbadb-b2ca-452c-b43a-7aeca112950b.sql
-- ========================

-- Popular tabela de rewards com recompensas iniciais usando tipos corretos
INSERT INTO public.rewards (name, description, type, required_level, required_xp, required_badge_id, badge_id, ebook_id, metadata, is_active)
VALUES
  -- Recompensas de Badges Exclusivos por NÃ­vel
  (
    'Badge de Perfil AvanÃ§ado',
    'Desbloqueie o badge especial de Perfil AvanÃ§ado ao atingir nÃ­vel 3',
    'badge_exclusive',
    3,
    NULL,
    NULL,
    (SELECT id FROM public.badges WHERE name = 'Leitor Entusiasta' LIMIT 1),
    NULL,
    '{"unlock_type": "level", "level_required": 3, "benefit": "Destaque visual no perfil"}',
    true
  ),
  (
    'Badge de Destaque no Ranking',
    'Desbloqueie o badge de Destaque no Ranking ao atingir nÃ­vel 5',
    'badge_exclusive',
    5,
    NULL,
    NULL,
    (SELECT id FROM public.badges WHERE name = 'Conhecedor' LIMIT 1),
    NULL,
    '{"unlock_type": "level", "level_required": 5, "benefit": "Aparece destacado nos rankings"}',
    true
  ),
  (
    'Badge VIP Elite',
    'Desbloqueie o badge VIP Elite ao atingir o nÃ­vel mÃ¡ximo',
    'badge_exclusive',
    7,
    NULL,
    NULL,
    (SELECT id FROM public.badges WHERE name = 'Expert Leitor' LIMIT 1),
    NULL,
    '{"unlock_type": "level", "level_required": 7, "benefit": "Acesso antecipado a novos ebooks"}',
    true
  ),
  
  -- Boost de XP por Conquistas
  (
    'Boost de XP Bronze',
    'Ganhe 20% mais XP em todas as leituras apÃ³s acumular 1500 XP',
    'xp_boost',
    NULL,
    1500,
    NULL,
    NULL,
    NULL,
    '{"boost_percentage": 20, "tier": "bronze", "unlock_type": "xp"}',
    true
  ),
  (
    'Boost de XP Prata',
    'Ganhe 35% mais XP em todas as leituras apÃ³s acumular 7000 XP',
    'xp_boost',
    NULL,
    7000,
    NULL,
    NULL,
    NULL,
    '{"boost_percentage": 35, "tier": "silver", "unlock_type": "xp"}',
    true
  ),
  (
    'Boost de XP Ouro',
    'Ganhe 50% mais XP em todas as leituras apÃ³s acumular 15000 XP',
    'xp_boost',
    NULL,
    15000,
    NULL,
    NULL,
    NULL,
    '{"boost_percentage": 50, "tier": "gold", "unlock_type": "xp"}',
    true
  ),
  
  -- Recompensas Personalizadas por Badges
  (
    'Desconto Especial - Maratonista',
    'Ganhe 10% de desconto permanente apÃ³s completar 5 livros',
    'custom',
    NULL,
    NULL,
    (SELECT id FROM public.badges WHERE name = 'Maratonista' LIMIT 1),
    NULL,
    NULL,
    '{"reward_type": "discount", "discount_percentage": 10, "achievement_type": "books_completed"}',
    true
  ),
  (
    'BenefÃ­cio de Chama Eterna',
    'Ganhe um ebook grÃ¡tis ao manter 30 dias de sequÃªncia',
    'custom',
    NULL,
    NULL,
    (SELECT id FROM public.badges WHERE name = 'Chama de 30 dias' LIMIT 1),
    NULL,
    NULL,
    '{"reward_type": "free_ebook", "achievement_type": "streak", "quantity": 1}',
    true
  ),
  (
    'Acesso Premium TemporÃ¡rio',
    'Desbloqueie 7 dias de acesso premium ao ser Expert',
    'custom',
    5,
    NULL,
    NULL,
    NULL,
    NULL,
    '{"reward_type": "premium_access", "duration_days": 7, "unlock_type": "level"}',
    true
  );

-- ========================
-- File: 20251017122615_ece0432c-438f-4fed-a2aa-ec427f704354.sql
-- ========================

-- Allow service role to insert purchased ebooks into user_ebooks table
CREATE POLICY "Service can insert user ebooks"
ON user_ebooks FOR INSERT
TO service_role
WITH CHECK (true);

-- ========================
-- File: 20251017125003_3cb30af0-6117-428c-b229-2feaea7d5178.sql
-- ========================

-- Create product mappings table
CREATE TABLE product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT UNIQUE NOT NULL,
  ebook_id UUID REFERENCES ebooks(id) NOT NULL,
  platform TEXT NOT NULL DEFAULT 'kiwify',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert the 4 correct mappings
INSERT INTO product_mappings (product_id, ebook_id, platform) VALUES
  ('625e5f79-ad1f-49b0-abf0-43cca3864c6e', '3fa85f64-5717-4562-b3fc-2c963f66afa6', 'kiwify'),
  ('3b1e4cf5-414e-4ff1-834a-8efaa0d24c94', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'kiwify'),
  ('346f79a0-9139-4ab2-b00b-06003194cb09', '308cf18e-2ea8-4241-adc2-da8582bec253', 'kiwify'),
  ('1e60fbaa-aa23-4c31-9457-07da1118d002', '7c9e6679-7425-40de-944b-e07fc1f90ae7', 'kiwify');

-- Enable RLS
ALTER TABLE product_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view product mappings"
ON product_mappings FOR SELECT
TO public
USING (true);

CREATE POLICY "Service can manage product mappings"
ON product_mappings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Fix existing pending purchases with correct ebook_id
UPDATE pending_purchases pp
SET ebook_id = pm.ebook_id
FROM product_mappings pm
WHERE pp.ebook_id::text = pm.product_id AND pp.claimed = false;

-- ========================
-- File: 20251017130835_a20ef900-aeda-482e-a973-cbcc37081df0.sql
-- ========================

-- Fix old data in pending_purchases by mapping product_id to real ebook_id
-- Step 1: Update ebook_id from product_id to real ebook_id using product_mappings
UPDATE pending_purchases pp
SET ebook_id = pm.ebook_id
FROM product_mappings pm
WHERE pp.ebook_id::text = pm.product_id
  AND pp.ebook_id != pm.ebook_id;

-- Step 2: Reset claimed status for purchases that were marked claimed but never delivered
-- (claimed=true but no claimed_by and user doesn't own the ebook)
UPDATE pending_purchases pp
SET 
  claimed = false,
  claimed_at = NULL,
  claimed_by = NULL
WHERE pp.claimed = true
  AND pp.claimed_by IS NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM user_ebooks ue 
    INNER JOIN auth.users au ON au.id = ue.user_id
    WHERE ue.ebook_id = pp.ebook_id 
      AND LOWER(TRIM(au.email)) = LOWER(TRIM(pp.email))
  );

-- ========================
-- File: 20251017133630_c231c5e3-38eb-4931-911a-6468d1cca8a8.sql
-- ========================

-- Aumentar limites de tamanho dos buckets de storage
UPDATE storage.buckets
SET file_size_limit = 104857600 -- 100 MB em bytes
WHERE id = 'ebooks';

UPDATE storage.buckets
SET file_size_limit = 20971520 -- 20 MB em bytes
WHERE id = 'covers';

UPDATE storage.buckets
SET file_size_limit = 52428800 -- 50 MB em bytes
WHERE id = 'samples';

-- ========================
-- File: 20251017141123_c2cd805d-90a1-4e69-ad5d-233ad7bfc9ed.sql
-- ========================

-- Permitir admins visualizarem todos os ebooks (ativos e inativos)
CREATE POLICY "Admins can view all ebooks"
ON public.ebooks
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- ========================
-- File: 20251017143122_fc0caaa1-6c57-42f0-ba3a-c489416aae6a.sql
-- ========================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Service can manage product mappings" ON public.product_mappings;

-- Allow admins to manage product mappings
CREATE POLICY "Admins can manage product mappings"
ON public.product_mappings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ========================
-- File: 20251017151507_d3529594-6a85-482a-8837-3ecb52441802.sql
-- ========================

-- Make the existing ebooks bucket public
update storage.buckets
set public = true
where id = 'ebooks';

-- Allow public read access to files in the 'ebooks' bucket
drop policy if exists "Public read access for ebooks" on storage.objects;

create policy "Public read access for ebooks"
  on storage.objects
  for select
  using (bucket_id = 'ebooks');


-- ========================
-- File: 20251017152426_c5784bf3-07b4-4cfe-8144-ac910b03c256.sql
-- ========================

-- ========================================
-- FASE 1: CORREÃ‡Ã•ES CRÃTICAS DE SEGURANÃ‡A
-- ========================================

-- 1. PROTEÃ‡ÃƒO DE DADOS PESSOAIS (profiles)
-- Remover polÃ­tica pÃºblica que expÃµe emails e telefones
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Criar view pÃºblica com apenas dados nÃ£o sensÃ­veis
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  created_at
FROM public.profiles;

-- PolÃ­tica: usuÃ¡rio pode ver seu prÃ³prio perfil completo
CREATE POLICY "Users can view own complete profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- PolÃ­tica: outros usuÃ¡rios nÃ£o podem acessar diretamente a tabela profiles
-- Devem usar a view public_profiles para dados pÃºblicos
CREATE POLICY "Public cannot view other profiles directly"
  ON public.profiles FOR SELECT
  USING (false);

-- Permitir acesso pÃºblico Ã  view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2. PROTEÃ‡ÃƒO DE CONFIGURAÃ‡ÃƒO DE PRODUTOS
-- Remover acesso pÃºblico aos mapeamentos de produtos
DROP POLICY IF EXISTS "Anyone can view product mappings" ON public.product_mappings;

-- Apenas admins podem gerenciar (jÃ¡ existe polÃ­tica admin)
-- Adicionar polÃ­tica de leitura restrita para sistema
CREATE POLICY "System can read product mappings"
  ON public.product_mappings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 3. PROTEÃ‡ÃƒO DO SISTEMA DE NOTIFICAÃ‡Ã•ES
-- Bloquear INSERT direto de usuÃ¡rios (usar apenas funÃ§Ã£o create_notification)
-- NÃ£o hÃ¡ polÃ­tica INSERT existente, entÃ£o apenas garantir que nÃ£o seja criada

-- 4. PROTEÃ‡ÃƒO DE HISTÃ“RICO DE COMPRAS
-- Bloquear modificaÃ§Ãµes nÃ£o autorizadas em user_ebooks
CREATE POLICY "Prevent unauthorized updates to user ebooks"
  ON public.user_ebooks FOR UPDATE
  USING (false);

CREATE POLICY "Prevent unauthorized deletions of user ebooks"
  ON public.user_ebooks FOR DELETE
  USING (false);

-- 5. PROTEÃ‡ÃƒO ADICIONAL: Garantir que profiles sÃ³ pode ser atualizado pelo prÃ³prio usuÃ¡rio
-- A polÃ­tica jÃ¡ existe mas vamos garantir que estÃ¡ correta
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ========================
-- File: 20251017152442_6a12d9da-52b0-41e6-8dad-3b6c8f046621.sql
-- ========================

-- ========================================
-- CORREÃ‡ÃƒO DOS AVISOS DE SEGURANÃ‡A DO LINTER
-- ========================================

-- 1. Remover SECURITY DEFINER da view public_profiles
-- A view nÃ£o precisa de SECURITY DEFINER pois apenas seleciona dados pÃºblicos
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  created_at
FROM public.profiles;

-- Garantir permissÃµes
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- ========================
-- File: 20251017153038_322cb9a6-7a16-40a2-825d-e7cc5b058564.sql
-- ========================

-- ========================================
-- FASE 2: POLÃTICAS RLS PARA TABELAS ADMINISTRATIVAS
-- ========================================

-- 1. CHAPTERS - Apenas admins podem gerenciar capÃ­tulos
DROP POLICY IF EXISTS "Authenticated users can view chapters" ON public.chapters;

CREATE POLICY "Anyone can view chapters"
  ON public.chapters FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert chapters"
  ON public.chapters FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update chapters"
  ON public.chapters FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete chapters"
  ON public.chapters FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. BADGES - Apenas admins podem gerenciar badges
DROP POLICY IF EXISTS "Anyone can view badges" ON public.badges;

CREATE POLICY "Anyone can view badges"
  ON public.badges FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert badges"
  ON public.badges FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update badges"
  ON public.badges FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete badges"
  ON public.badges FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. CHALLENGES - Apenas admins podem gerenciar desafios
DROP POLICY IF EXISTS "Anyone can view active challenges" ON public.challenges;

CREATE POLICY "Anyone can view active challenges"
  ON public.challenges FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all challenges"
  ON public.challenges FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert challenges"
  ON public.challenges FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update challenges"
  ON public.challenges FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete challenges"
  ON public.challenges FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. REWARDS - Apenas admins podem gerenciar recompensas
DROP POLICY IF EXISTS "Anyone can view active rewards" ON public.rewards;

CREATE POLICY "Anyone can view active rewards"
  ON public.rewards FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all rewards"
  ON public.rewards FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert rewards"
  ON public.rewards FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update rewards"
  ON public.rewards FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete rewards"
  ON public.rewards FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. ÃNDICES PARA PERFORMANCE
-- Ãndice para melhorar queries de perfis pÃºblicos
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- Ãndices para gamificaÃ§Ã£o
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON public.user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_total_xp ON public.user_gamification(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_gamification_current_level ON public.user_gamification(current_level DESC);

-- Ãndices para leaderboard e ranking
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);

-- Ãndices para posts e comunidade
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);

-- Ãndices para compras e ebooks
CREATE INDEX IF NOT EXISTS idx_user_ebooks_user_id ON public.user_ebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ebooks_ebook_id ON public.user_ebooks(ebook_id);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_email ON public.pending_purchases(email);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_claimed ON public.pending_purchases(claimed);

-- Ãndices para progresso de leitura
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_ebook_id ON public.user_progress(ebook_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON public.user_progress(completed);

-- ========================
-- File: 20251017153351_c6d4d7d2-a1e5-4692-b741-660528d69da9.sql
-- ========================

-- ========================================
-- FASE 2: ÃNDICES PARA PERFORMANCE
-- ========================================

-- Ãndices para gamificaÃ§Ã£o e leaderboard
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON public.user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_total_xp ON public.user_gamification(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_gamification_current_level ON public.user_gamification(current_level DESC);

-- Ãndices para badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);

-- Ãndices para posts e comunidade
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);

-- Ãndices para compras e ebooks
CREATE INDEX IF NOT EXISTS idx_user_ebooks_user_id ON public.user_ebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ebooks_ebook_id ON public.user_ebooks(ebook_id);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_email ON public.pending_purchases(email);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_claimed ON public.pending_purchases(claimed);
CREATE INDEX IF NOT EXISTS idx_purchase_clicks_user_id ON public.purchase_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_clicks_ebook_id ON public.purchase_clicks(ebook_id);

-- Ãndices para progresso de leitura
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_ebook_id ON public.user_progress(ebook_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON public.user_progress(completed);

-- Ãndices para notificaÃ§Ãµes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Ãndices para follows
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON public.user_follows(following_id);

-- Ãndices para testimonials
CREATE INDEX IF NOT EXISTS idx_testimonials_ebook_id ON public.testimonials(ebook_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_user_id ON public.testimonials(user_id);
CREATE INDEX IF NOT EXISTS idx_testimonial_likes_testimonial_id ON public.testimonial_likes(testimonial_id);

-- ========================
-- File: 20251017172300_4e15f883-51fe-49e7-bb30-c8e41a0370eb.sql
-- ========================

-- Sistema de ModeraÃ§Ã£o de ConteÃºdo com IA
CREATE TABLE IF NOT EXISTS public.content_moderation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'testimonial')),
  content_id UUID NOT NULL,
  ai_score DECIMAL(3,2) CHECK (ai_score >= 0 AND ai_score <= 1),
  flags JSONB DEFAULT '[]'::jsonb,
  ai_analysis TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_approved')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_moderation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all moderation"
ON public.content_moderation FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update moderation"
ON public.content_moderation FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert moderation"
ON public.content_moderation FOR INSERT
WITH CHECK (true);

-- Programa de Beta Testers
CREATE TABLE IF NOT EXISTS public.beta_testers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ebooks_received UUID[] DEFAULT ARRAY[]::UUID[],
  reviews_submitted INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'inactive')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id)
);

ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own beta status"
ON public.beta_testers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own beta application"
ON public.beta_testers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage beta testers"
ON public.beta_testers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Sistema de IndicaÃ§Ãµes (Referrals)
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  referred_email TEXT,
  referred_user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'expired')),
  conversion_date TIMESTAMP WITH TIME ZONE,
  reward_type TEXT CHECK (reward_type IN ('xp', 'ebook', 'badge')),
  reward_claimed BOOLEAN DEFAULT FALSE,
  reward_claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can insert own referrals"
ON public.referrals FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "System can update referrals"
ON public.referrals FOR UPDATE
USING (true);

CREATE POLICY "Admins can manage referrals"
ON public.referrals FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- FunÃ§Ã£o para gerar cÃ³digo de indicaÃ§Ã£o Ãºnico
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

-- Ãndices para performance
CREATE INDEX IF NOT EXISTS idx_content_moderation_status ON public.content_moderation(status);
CREATE INDEX IF NOT EXISTS idx_content_moderation_content ON public.content_moderation(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_beta_testers_user ON public.beta_testers(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);

-- ========================
-- File: 20251017173942_487d899a-2726-4fa5-8394-ce30bcec68ec.sql
-- ========================

-- MÃ­dia em Depoimentos
CREATE TABLE IF NOT EXISTS testimonial_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE testimonial_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view testimonial media"
ON testimonial_media FOR SELECT
USING (true);

CREATE POLICY "Users can insert media to own testimonials"
ON testimonial_media FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM testimonials 
    WHERE id = testimonial_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own testimonial media"
ON testimonial_media FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM testimonials 
    WHERE id = testimonial_id AND user_id = auth.uid()
  )
);

-- Galeria de CriaÃ§Ãµes
CREATE TABLE IF NOT EXISTS community_creations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  ebook_id UUID REFERENCES ebooks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  ingredients JSONB,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  likes_count INTEGER DEFAULT 0 NOT NULL,
  saves_count INTEGER DEFAULT 0 NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE community_creations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public creations"
ON community_creations FOR SELECT
USING (true);

CREATE POLICY "Users can insert own creations"
ON community_creations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own creations"
ON community_creations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own creations"
ON community_creations FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all creations"
ON community_creations FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS creation_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creation_id UUID REFERENCES community_creations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(creation_id, user_id)
);

ALTER TABLE creation_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view creation likes"
ON creation_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like creations"
ON creation_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike creations"
ON creation_likes FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar likes_count em community_creations
CREATE OR REPLACE FUNCTION update_creation_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_creations
    SET likes_count = likes_count + 1
    WHERE id = NEW.creation_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_creations
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.creation_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER creation_likes_count_trigger
AFTER INSERT OR DELETE ON creation_likes
FOR EACH ROW EXECUTE FUNCTION update_creation_likes_count();

-- Q&A System
CREATE TABLE IF NOT EXISTS ebook_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  is_answered BOOLEAN DEFAULT FALSE NOT NULL,
  helpful_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE ebook_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions"
ON ebook_questions FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can ask questions"
ON ebook_questions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questions"
ON ebook_questions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own questions"
ON ebook_questions FOR DELETE
USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES ebook_questions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  answer TEXT NOT NULL,
  is_verified_purchaser BOOLEAN DEFAULT FALSE NOT NULL,
  is_official BOOLEAN DEFAULT FALSE NOT NULL,
  helpful_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view answers"
ON question_answers FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can answer questions"
ON question_answers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
ON question_answers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own answers"
ON question_answers FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all answers"
ON question_answers FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Trigger para marcar pergunta como respondida
CREATE OR REPLACE FUNCTION mark_question_answered()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ebook_questions
  SET is_answered = true
  WHERE id = NEW.question_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER question_answered_trigger
AFTER INSERT ON question_answers
FOR EACH ROW EXECUTE FUNCTION mark_question_answered();

-- Live Activity Tracking
CREATE TABLE IF NOT EXISTS live_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('viewing', 'purchased', 'completed', 'reading')),
  user_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE live_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live activity"
ON live_activity FOR SELECT
USING (true);

CREATE POLICY "System can insert live activity"
ON live_activity FOR INSERT
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_community_creations_updated_at
BEFORE UPDATE ON community_creations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================
-- File: 20251017183056_a9a4fc3f-f99c-4f45-b557-4bb759b92f86.sql
-- ========================

-- Create push_subscriptions table for PWA notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON public.push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON public.push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_push_subscriptions_updated_at();

-- ========================
-- File: 20251017221437_f6443d64-2f9b-4f0e-9b7c-1982991f614f.sql
-- ========================

-- Create installation badge with correct category
INSERT INTO public.badges (
  name,
  description,
  icon,
  category,
  xp_reward,
  criteria
) VALUES (
  'Instalador',
  'Instalou o app no dispositivo',
  'smartphone',
  'special',
  100,
  '{"action": "install_app"}'::jsonb
) ON CONFLICT DO NOTHING;

-- ========================
-- File: 20251018142952_1aabc2d7-958e-4e69-977c-87947d9c6d72.sql
-- ========================

-- Fix 1: Recreate public_profiles view without sensitive data
DROP VIEW IF EXISTS public_profiles CASCADE;

CREATE VIEW public_profiles AS 
SELECT 
  id, 
  full_name, 
  avatar_url, 
  bio,
  created_at
FROM profiles;

COMMENT ON VIEW public_profiles IS 'Public view of profiles without sensitive data (email, whatsapp)';

-- Fix 5: Restrict live_activity to authenticated users only
DROP POLICY IF EXISTS "Anyone can view live activity" ON live_activity;

CREATE POLICY "Authenticated users can view live activity" 
ON live_activity FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix 2: Add audit logging trigger for pending_purchases
CREATE TABLE IF NOT EXISTS pending_purchases_audit (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type text NOT NULL,
  pending_purchase_id uuid,
  user_id uuid,
  accessed_at timestamp with time zone DEFAULT now(),
  accessed_by uuid
);

-- Enable RLS on audit table
ALTER TABLE pending_purchases_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" 
ON pending_purchases_audit FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_pending_purchases()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pending_purchases_audit (
    action_type,
    pending_purchase_id,
    user_id,
    accessed_by
  ) VALUES (
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach audit trigger
DROP TRIGGER IF EXISTS audit_pending_purchases_trigger ON pending_purchases;
CREATE TRIGGER audit_pending_purchases_trigger
AFTER INSERT OR UPDATE OR DELETE ON pending_purchases
FOR EACH ROW EXECUTE FUNCTION audit_pending_purchases();

-- Add data retention policy function
CREATE OR REPLACE FUNCTION cleanup_old_pending_purchases()
RETURNS void AS $$
BEGIN
  -- Delete claimed purchases older than 90 days
  DELETE FROM pending_purchases 
  WHERE claimed = true 
  AND created_at < NOW() - INTERVAL '90 days';
  
  -- Delete unclaimed purchases older than 180 days
  DELETE FROM pending_purchases 
  WHERE claimed = false 
  AND created_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ========================
-- File: 20251018145433_9da88cba-d8f4-4236-b6e2-b61805b5d07f.sql
-- ========================

-- Fix 1: Recreate public_profiles view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS SELECT 
  id, 
  full_name, 
  avatar_url, 
  bio,
  created_at
FROM public.profiles;

-- Add RLS policy to allow viewing public profile data through the view
CREATE POLICY "Anyone can view public profile fields"
ON public.profiles
FOR SELECT
USING (true);

-- Fix 2: Create server-side rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create unique index for rate limiting lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limit_identifier_action 
ON public.rate_limit_attempts(identifier, action);

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_window_start 
ON public.rate_limit_attempts(window_start);

-- Enable RLS on rate_limit_attempts
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

-- Allow system to manage rate limits
CREATE POLICY "System can manage rate limits"
ON public.rate_limit_attempts
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to check and record rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_attempts INTEGER,
  p_window_minutes INTEGER,
  p_block_minutes INTEGER
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_window_start TIMESTAMP WITH TIME ZONE := v_now - (p_window_minutes || ' minutes')::INTERVAL;
  v_result jsonb;
BEGIN
  -- Get or create rate limit record
  SELECT * INTO v_record
  FROM public.rate_limit_attempts
  WHERE identifier = p_identifier AND action = p_action
  FOR UPDATE;

  -- Check if blocked
  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > v_now THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'remaining_seconds', EXTRACT(EPOCH FROM (v_record.blocked_until - v_now))::INTEGER,
      'attempts_left', 0
    );
  END IF;

  -- Check if window expired, reset if so
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

  -- Check if over limit
  IF v_record.attempts >= p_max_attempts THEN
    -- Block user
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

  -- Increment attempts
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
    -- Create new record
    INSERT INTO public.rate_limit_attempts (identifier, action, attempts, window_start)
    VALUES (p_identifier, p_action, 1, v_now);
    
    RETURN jsonb_build_object(
      'allowed', true,
      'blocked', false,
      'attempts_left', p_max_attempts - 1
    );
END;
$$;

-- Create function to reset rate limit (after successful login)
CREATE OR REPLACE FUNCTION public.reset_rate_limit(
  p_identifier TEXT,
  p_action TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limit_attempts
  WHERE identifier = p_identifier AND action = p_action;
END;
$$;

-- Create cleanup function for old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limit_attempts
  WHERE window_start < NOW() - INTERVAL '24 hours'
  AND (blocked_until IS NULL OR blocked_until < NOW());
END;
$$;

-- ========================
-- File: 20251018205203_5b6ee8df-c39a-43ff-a9ff-7fd66b4359ad.sql
-- ========================

-- Fix product_mappings RLS policy to prevent enumeration
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can read product mappings" ON product_mappings;

-- Create admin-only read policy
CREATE POLICY "Only admins can read product mappings"
ON product_mappings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create secure function for edge functions to lookup mappings
CREATE OR REPLACE FUNCTION get_ebook_id_for_product(p_product_id text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ebook_id 
  FROM product_mappings 
  WHERE product_id = p_product_id 
  AND platform = 'kiwify'
  LIMIT 1;
$$;

-- ========================
-- File: 20251019173653_ebd62299-fe4a-4337-8ba3-507e20924f8f.sql
-- ========================

-- Criar funÃ§Ãµes para incrementar/decrementar contadores automaticamente

-- FunÃ§Ã£o para incrementar comments_count
CREATE OR REPLACE FUNCTION public.inc_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.community_posts
  SET comments_count = comments_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

-- FunÃ§Ã£o para decrementar comments_count
CREATE OR REPLACE FUNCTION public.dec_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.community_posts
  SET comments_count = GREATEST(comments_count - 1, 0)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

-- FunÃ§Ã£o para incrementar likes_count
CREATE OR REPLACE FUNCTION public.inc_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.community_posts
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

-- FunÃ§Ã£o para decrementar likes_count
CREATE OR REPLACE FUNCTION public.dec_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.community_posts
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

-- Criar triggers para post_comments
CREATE TRIGGER trg_post_comments_inc
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE PROCEDURE public.inc_comments_count();

CREATE TRIGGER trg_post_comments_dec
AFTER DELETE ON public.post_comments
FOR EACH ROW
EXECUTE PROCEDURE public.dec_comments_count();

-- Criar triggers para post_likes
CREATE TRIGGER trg_post_likes_inc
AFTER INSERT ON public.post_likes
FOR EACH ROW
EXECUTE PROCEDURE public.inc_likes_count();

CREATE TRIGGER trg_post_likes_dec
AFTER DELETE ON public.post_likes
FOR EACH ROW
EXECUTE PROCEDURE public.dec_likes_count();

-- Backfill: recalcular contadores existentes
UPDATE public.community_posts p
SET comments_count = COALESCE(c.cnt, 0)
FROM (
  SELECT post_id, COUNT(*) as cnt
  FROM public.post_comments
  GROUP BY post_id
) c
WHERE p.id = c.post_id;

UPDATE public.community_posts p
SET likes_count = COALESCE(l.cnt, 0)
FROM (
  SELECT post_id, COUNT(*) as cnt
  FROM public.post_likes
  GROUP BY post_id
) l
WHERE p.id = l.post_id;

-- ========================
-- File: 20251019183126_a15a1388-d1f8-44de-88c7-253fb911fb62.sql
-- ========================

-- Create analytics_events table for tracking user interactions
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own analytics"
  ON public.analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own analytics"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ========================
-- File: 20251019185359_442190ac-d1b1-4e15-b8b2-a5210867caed.sql
-- ========================

-- FASE 2.1: Remover programa Beta
DROP TABLE IF EXISTS beta_testers CASCADE;

-- FASE 2.2: Adicionar colunas de recompensas ao sistema de referrals
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS reward_type text,
ADD COLUMN IF NOT EXISTS reward_ebook_id uuid REFERENCES ebooks(id),
ADD COLUMN IF NOT EXISTS reward_claimed_at timestamp with time zone;

-- ========================
-- File: 20251019212926_01d25906-b535-4bb6-88f8-a82eaf4b4825.sql
-- ========================

-- FASE 1: CORREÃ‡Ã•ES CRÃTICAS DE SEGURANÃ‡A

-- 1. Corrigir RLS da tabela profiles (ocultar email/whatsapp de outros usuÃ¡rios)
DROP POLICY IF EXISTS "Anyone can view public profile fields" ON public.profiles;
DROP POLICY IF EXISTS "Public cannot view other profiles directly" ON public.profiles;

-- Policy para visualizaÃ§Ã£o: usuÃ¡rios autenticados veem campos limitados
CREATE POLICY "Authenticated users can view limited profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Recriar view pÃºblica apenas com campos nÃ£o sensÃ­veis
DROP VIEW IF EXISTS public.public_profiles;
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  created_at
FROM public.profiles;

-- 2. Corrigir RLS - user_follows (apenas autenticados)
DROP POLICY IF EXISTS "Anyone can view follows" ON public.user_follows;

CREATE POLICY "Authenticated users can view follows"
ON public.user_follows FOR SELECT
TO authenticated
USING (true);

-- 3. Corrigir RLS - community_posts (apenas autenticados)
DROP POLICY IF EXISTS "Todos podem ver posts pÃºblicos" ON public.community_posts;

CREATE POLICY "Authenticated users can view public posts"
ON public.community_posts FOR SELECT
TO authenticated
USING (is_public = true);

-- 4. Corrigir RLS - post_likes (apenas autenticados)
DROP POLICY IF EXISTS "Todos podem ver curtidas" ON public.post_likes;

CREATE POLICY "Authenticated users can view likes"
ON public.post_likes FOR SELECT
TO authenticated
USING (true);

-- 5. Corrigir RLS - ebook_questions (apenas autenticados)
DROP POLICY IF EXISTS "Anyone can view questions" ON public.ebook_questions;

CREATE POLICY "Authenticated users can view questions"
ON public.ebook_questions FOR SELECT
TO authenticated
USING (true);

-- 6. Verificar e documentar constraint de notifications
COMMENT ON CONSTRAINT notifications_type_check ON public.notifications IS 
'Allowed types: achievement, level_up, streak, challenge, reward, badge, referral, system, community, ebook';

-- ========================
-- File: 20251019212943_cf81c9fb-76fb-4fee-b211-b05767bda5f0.sql
-- ========================

-- Corrigir a view public_profiles removendo security definer
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  created_at
FROM public.profiles;

-- ========================
-- File: 20251019212959_57c88249-3b09-4774-a02f-d222d7a786f8.sql
-- ========================

-- Corrigir a view public_profiles removendo security definer
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  created_at
FROM public.profiles;

-- ========================
-- File: 20251020221729_5123f28a-ad87-4db3-88ba-a77598effc4d.sql
-- ========================

-- Corrigir constraint de notificaÃ§Ãµes e adicionar tipos faltantes

-- Remover constraint antiga
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Adicionar constraint com todos os tipos necessÃ¡rios
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'level_up', 
  'badge_earned', 
  'challenge_completed', 
  'challenge_new', 
  'follow', 
  'like', 
  'comment', 
  'system',
  'purchase',
  'reward',
  'achievement',
  'streak'
));

-- ========================
-- File: 20251020221746_54dc3bc3-54f1-4d35-b298-30eaa70e440a.sql
-- ========================

-- Adicionar rastreamento de recompensa de instalaÃ§Ã£o no banco de dados

-- Adicionar coluna para rastrear se usuÃ¡rio jÃ¡ recebeu recompensa de instalaÃ§Ã£o
ALTER TABLE user_gamification 
ADD COLUMN IF NOT EXISTS install_reward_claimed BOOLEAN DEFAULT false;

-- ========================
-- File: 20251020221858_93ac20b1-257a-4e1a-8bd1-fb8adb71fcdd.sql
-- ========================

-- Corrigir view public_profiles para nÃ£o usar SECURITY DEFINER

-- Dropar view antiga
DROP VIEW IF EXISTS public_profiles;

-- Recriar view sem SECURITY DEFINER
CREATE VIEW public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  created_at
FROM profiles;

-- Garantir acesso Ã  view
GRANT SELECT ON public_profiles TO authenticated;
GRANT SELECT ON public_profiles TO anon;

-- ========================
-- File: 20251020224117_6d46d47b-5f39-452e-95c3-5d81790772a3.sql
-- ========================

-- Fix: Remover SECURITY DEFINER da view public_profiles
-- Esta view deve usar SECURITY INVOKER para respeitar RLS policies
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

-- ========================
-- File: 20251115120000_increment_daily_stats.sql
-- ========================

-- Incrementa mÃ©tricas diÃ¡rias de leitura de forma atÃ´mica
CREATE OR REPLACE FUNCTION public.increment_daily_stats(
  p_user_id uuid,
  p_date date,
  p_pages_delta integer,
  p_xp_delta integer,
  p_books_delta integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Garantir polÃ­tica RLS permite o usuÃ¡rio atualizar apenas seu prÃ³prio registro
-- As polÃ­ticas existentes jÃ¡ restringem SELECT/INSERT/UPDATE por auth.uid(); esta funÃ§Ã£o roda como SECURITY DEFINER

-- ========================
-- File: 20251115121000_add_xp_atomic.sql
-- ========================

-- FunÃ§Ã£o transacional para adicionar XP de forma segura
CREATE OR REPLACE FUNCTION public.add_xp_atomic(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_related_ebook_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS TABLE(new_xp integer, new_level integer, level_up boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current RECORD;
  v_new_xp integer;
  v_old_level integer;
  v_new_level integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid XP amount';
  END IF;

  -- Bloqueia a linha do usuÃ¡rio para atualizaÃ§Ã£o concorrente
  SELECT * INTO v_current
  FROM public.user_gamification
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Inicializa registro se nÃ£o existir
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
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.xp_transactions(user_id, xp_amount, reason, related_ebook_id, metadata)
  VALUES (p_user_id, p_amount, p_reason, p_related_ebook_id, p_metadata);

  RETURN QUERY SELECT v_new_xp, v_new_level, (v_new_level > v_old_level);
END;
$$;

-- ========================
-- File: 20251115122000_push_tables.sql
-- ========================

-- Tabela de logs de entrega de push
CREATE TABLE IF NOT EXISTS public.push_delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL,
  message_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_delivery_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all push logs"
  ON public.push_delivery_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert push logs"
  ON public.push_delivery_logs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Alterar push_subscriptions para suportar FCM
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS fcm_token text,
  ADD COLUMN IF NOT EXISTS device_info jsonb,
  ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_fcm_token ON public.push_subscriptions(fcm_token);
CREATE INDEX IF NOT EXISTS idx_push_delivery_logs_user ON public.push_delivery_logs(user_id, created_at DESC);

-- ========================
-- File: 20251115130000_app_settings.sql
-- ========================

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view app settings"
  ON public.app_settings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert app settings"
  ON public.app_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update app settings"
  ON public.app_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- ========================
-- File: 20251117144700_rate_limit_stubs.sql
-- ========================

create or replace function public.reset_rate_limit(
  p_identifier text
) returns boolean
language plpgsql
security definer
as $$
begin
  return true;
end;
$$;

-- ========================
-- File: 20251117162000_licenses.sql
-- ========================

create extension if not exists pgcrypto;

create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  license_key text unique not null,
  allowed_domains text[] not null default array[]::text[],
  status text not null default 'active',
  issued_at timestamptz default now()
);

create or replace function public.extract_hostname(p_origin text)
returns text
language plpgsql
as $$
declare
  host text;
begin
  -- Remove protocolo e caminho
  -- Ex.: https://example.com -> example.com
  host := regexp_replace(p_origin, '^https?://', '');
  host := split_part(host, '/', 1);
  return lower(host);
end;
$$;

create or replace function public.validate_license(p_license_key text, p_origin text)
returns boolean
language plpgsql
security definer
stable
as $$
declare
  host text := public.extract_hostname(p_origin);
  ok boolean := false;
begin
  select true into ok
  from public.licenses l
  where l.license_key = p_license_key
    and l.status = 'active'
    and (host = any(l.allowed_domains));

  return coalesce(ok, false);
end;
$$;

grant execute on function public.validate_license(text, text) to anon, authenticated;
