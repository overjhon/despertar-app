-- =====================================================
-- MIGRAÇÃO COMPLETA - MUNDO DELAS
-- Data: 2025-10-28
-- =====================================================

-- =====================================================
-- PARTE 1: TIPOS CUSTOMIZADOS
-- =====================================================

CREATE TYPE app_role AS ENUM ('user', 'admin', 'moderator');

-- =====================================================
-- PARTE 2: TABELAS DE AUTENTICAÇÃO E PERFIS
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
-- PARTE 3: E-BOOKS E CONTEÚDO
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
-- PARTE 4: GAMIFICAÇÃO
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
-- PARTE 6: AVALIAÇÕES E DEPOIMENTOS
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
-- PARTE 8: MODERAÇÃO E SEGURANÇA
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
-- Para continuar, execute o próximo arquivo: 00000000000001_functions.sql

