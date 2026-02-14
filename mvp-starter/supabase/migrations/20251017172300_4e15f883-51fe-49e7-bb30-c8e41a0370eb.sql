-- Sistema de Moderação de Conteúdo com IA
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

-- Sistema de Indicações (Referrals)
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

-- Função para gerar código de indicação único
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_content_moderation_status ON public.content_moderation(status);
CREATE INDEX IF NOT EXISTS idx_content_moderation_content ON public.content_moderation(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_beta_testers_user ON public.beta_testers(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);