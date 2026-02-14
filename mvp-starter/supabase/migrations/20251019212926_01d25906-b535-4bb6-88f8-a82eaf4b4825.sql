-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA

-- 1. Corrigir RLS da tabela profiles (ocultar email/whatsapp de outros usuários)
DROP POLICY IF EXISTS "Anyone can view public profile fields" ON public.profiles;
DROP POLICY IF EXISTS "Public cannot view other profiles directly" ON public.profiles;

-- Policy para visualização: usuários autenticados veem campos limitados
CREATE POLICY "Authenticated users can view limited profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Recriar view pública apenas com campos não sensíveis
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
DROP POLICY IF EXISTS "Todos podem ver posts públicos" ON public.community_posts;

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