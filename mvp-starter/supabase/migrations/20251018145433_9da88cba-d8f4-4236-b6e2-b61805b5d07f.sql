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