-- Corrigir view public_profiles para não usar SECURITY DEFINER

-- Dropar view antiga
DROP VIEW IF EXISTS public_profiles;

-- Recriar view sem SECURITY DEFINER
CREATE VIEW public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  created_at
FROM profiles;

-- Garantir acesso à view
GRANT SELECT ON public_profiles TO authenticated;
GRANT SELECT ON public_profiles TO anon;