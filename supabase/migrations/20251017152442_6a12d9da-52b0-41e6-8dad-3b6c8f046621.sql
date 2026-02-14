-- ========================================
-- CORREÇÃO DOS AVISOS DE SEGURANÇA DO LINTER
-- ========================================

-- 1. Remover SECURITY DEFINER da view public_profiles
-- A view não precisa de SECURITY DEFINER pois apenas seleciona dados públicos
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  created_at
FROM public.profiles;

-- Garantir permissões
GRANT SELECT ON public.public_profiles TO anon, authenticated;