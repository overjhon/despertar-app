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
('Primeiro Passo', 'Complete seu primeiro ebook', '📚', 'reading', 100, '{"type": "ebooks_completed", "count": 1}'),
('Leitor Dedicado', 'Complete 5 ebooks', '📖', 'reading', 250, '{"type": "ebooks_completed", "count": 5}'),
('Mestre dos Livros', 'Complete 10 ebooks', '🏆', 'reading', 500, '{"type": "ebooks_completed", "count": 10}'),
('Streak 7', 'Leia por 7 dias consecutivos', '🔥', 'reading', 200, '{"type": "streak_days", "count": 7}'),
('Streak 30', 'Leia por 30 dias consecutivos', '⭐', 'reading', 500, '{"type": "streak_days", "count": 30}'),
('Maratonista', 'Leia 100 páginas em um dia', '⚡', 'reading', 300, '{"type": "pages_in_day", "count": 100}'),
('Explorador', 'Leia ebooks de 3 categorias diferentes', '🌍', 'reading', 250, '{"type": "categories", "count": 3}'),
('Velocista', 'Complete um ebook em menos de 48 horas', '🚀', 'reading', 300, '{"type": "completion_time_hours", "max": 48}'),
('Night Owl', 'Leia após 22h (10 vezes)', '🌙', 'special', 150, '{"type": "reading_time", "after": "22:00", "count": 10}'),
('Early Bird', 'Leia antes das 7h (10 vezes)', '☀️', 'special', 150, '{"type": "reading_time", "before": "07:00", "count": 10}')
ON CONFLICT DO NOTHING;