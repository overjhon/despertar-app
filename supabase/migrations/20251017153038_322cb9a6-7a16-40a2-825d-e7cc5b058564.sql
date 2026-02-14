-- ========================================
-- FASE 2: POLÍTICAS RLS PARA TABELAS ADMINISTRATIVAS
-- ========================================

-- 1. CHAPTERS - Apenas admins podem gerenciar capítulos
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

-- 5. ÍNDICES PARA PERFORMANCE
-- Índice para melhorar queries de perfis públicos
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- Índices para gamificação
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON public.user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_total_xp ON public.user_gamification(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_gamification_current_level ON public.user_gamification(current_level DESC);

-- Índices para leaderboard e ranking
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);

-- Índices para posts e comunidade
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);

-- Índices para compras e ebooks
CREATE INDEX IF NOT EXISTS idx_user_ebooks_user_id ON public.user_ebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ebooks_ebook_id ON public.user_ebooks(ebook_id);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_email ON public.pending_purchases(email);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_claimed ON public.pending_purchases(claimed);

-- Índices para progresso de leitura
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_ebook_id ON public.user_progress(ebook_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON public.user_progress(completed);