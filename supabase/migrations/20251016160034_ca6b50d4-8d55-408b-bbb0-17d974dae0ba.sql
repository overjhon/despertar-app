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
('Leitor Semanal', 'Leia 100 páginas esta semana', 'weekly', 'pages_read', 100, 300, NOW(), NOW() + INTERVAL '7 days'),
('Maratonista Semanal', 'Complete 2 ebooks esta semana', 'weekly', 'ebooks_completed', 2, 500, NOW(), NOW() + INTERVAL '7 days'),
('Sequência de Ouro', 'Mantenha uma sequência de 7 dias', 'weekly', 'streak_days', 7, 400, NOW(), NOW() + INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;