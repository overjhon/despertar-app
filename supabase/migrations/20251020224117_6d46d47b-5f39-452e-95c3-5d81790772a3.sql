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