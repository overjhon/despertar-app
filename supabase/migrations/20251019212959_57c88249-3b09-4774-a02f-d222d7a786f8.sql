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