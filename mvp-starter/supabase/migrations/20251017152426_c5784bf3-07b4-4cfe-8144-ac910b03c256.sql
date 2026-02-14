-- ========================================
-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA
-- ========================================

-- 1. PROTEÇÃO DE DADOS PESSOAIS (profiles)
-- Remover política pública que expõe emails e telefones
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Criar view pública com apenas dados não sensíveis
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  created_at
FROM public.profiles;

-- Política: usuário pode ver seu próprio perfil completo
CREATE POLICY "Users can view own complete profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Política: outros usuários não podem acessar diretamente a tabela profiles
-- Devem usar a view public_profiles para dados públicos
CREATE POLICY "Public cannot view other profiles directly"
  ON public.profiles FOR SELECT
  USING (false);

-- Permitir acesso público à view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2. PROTEÇÃO DE CONFIGURAÇÃO DE PRODUTOS
-- Remover acesso público aos mapeamentos de produtos
DROP POLICY IF EXISTS "Anyone can view product mappings" ON public.product_mappings;

-- Apenas admins podem gerenciar (já existe política admin)
-- Adicionar política de leitura restrita para sistema
CREATE POLICY "System can read product mappings"
  ON public.product_mappings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 3. PROTEÇÃO DO SISTEMA DE NOTIFICAÇÕES
-- Bloquear INSERT direto de usuários (usar apenas função create_notification)
-- Não há política INSERT existente, então apenas garantir que não seja criada

-- 4. PROTEÇÃO DE HISTÓRICO DE COMPRAS
-- Bloquear modificações não autorizadas em user_ebooks
CREATE POLICY "Prevent unauthorized updates to user ebooks"
  ON public.user_ebooks FOR UPDATE
  USING (false);

CREATE POLICY "Prevent unauthorized deletions of user ebooks"
  ON public.user_ebooks FOR DELETE
  USING (false);

-- 5. PROTEÇÃO ADICIONAL: Garantir que profiles só pode ser atualizado pelo próprio usuário
-- A política já existe mas vamos garantir que está correta
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);