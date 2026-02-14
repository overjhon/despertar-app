-- ========================================
-- FASE 2: ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para gamificação e leaderboard
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON public.user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_total_xp ON public.user_gamification(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_gamification_current_level ON public.user_gamification(current_level DESC);

-- Índices para badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);

-- Índices para posts e comunidade
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);

-- Índices para compras e ebooks
CREATE INDEX IF NOT EXISTS idx_user_ebooks_user_id ON public.user_ebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ebooks_ebook_id ON public.user_ebooks(ebook_id);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_email ON public.pending_purchases(email);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_claimed ON public.pending_purchases(claimed);
CREATE INDEX IF NOT EXISTS idx_purchase_clicks_user_id ON public.purchase_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_clicks_ebook_id ON public.purchase_clicks(ebook_id);

-- Índices para progresso de leitura
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_ebook_id ON public.user_progress(ebook_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON public.user_progress(completed);

-- Índices para notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Índices para follows
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON public.user_follows(following_id);

-- Índices para testimonials
CREATE INDEX IF NOT EXISTS idx_testimonials_ebook_id ON public.testimonials(ebook_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_user_id ON public.testimonials(user_id);
CREATE INDEX IF NOT EXISTS idx_testimonial_likes_testimonial_id ON public.testimonial_likes(testimonial_id);