-- ==========================================
-- MIGRAÇÃO CRÍTICA: Triggers Essenciais
-- ==========================================
-- Esta migration é IDEMPOTENTE e pode rodar múltiplas vezes
-- Garante que triggers críticos existam após remix/importação
-- 
-- QUANDO EXECUTAR:
-- - Após remix do projeto
-- - Se o script VERIFY_MIGRATION.sql mostrar triggers faltando
-- - Se usuários criados não estiverem recebendo perfis automaticamente

-- ==========================================
-- FUNÇÃO 1: Criar perfil automaticamente
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- ==========================================
-- TRIGGER 1: Criar perfil ao criar usuário
-- ==========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 
'🔴 CRÍTICO: Cria perfil automaticamente ao criar usuário. NÃO REMOVER!';

-- ==========================================
-- FUNÇÃO 2: Atribuir role automaticamente
-- ==========================================
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ⚠️ CUSTOMIZE: Substitua 'admin@example.com' pelo SEU email de admin
  IF NEW.email = 'admin@example.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- ==========================================
-- TRIGGER 2: Atribuir role ao criar usuário
-- ==========================================
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_role();

COMMENT ON TRIGGER on_auth_user_created_assign_role ON auth.users IS 
'🔴 CRÍTICO: Atribui role automaticamente ao criar usuário. NÃO REMOVER!';

-- ==========================================
-- FUNÇÃO 3: Sincronizar email
-- ==========================================
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles 
  SET email = NEW.email 
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- ==========================================
-- TRIGGER 3: Sincronizar email ao atualizar
-- ==========================================
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_profile_email();

COMMENT ON TRIGGER on_auth_user_email_updated ON auth.users IS 
'🟡 IMPORTANTE: Mantém email sincronizado entre auth.users e profiles.';

-- ==========================================
-- FOREIGN KEY EXPLÍCITA (evita warning PGRST200)
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'testimonials_user_id_fkey'
  ) THEN
    ALTER TABLE testimonials 
      ADD CONSTRAINT testimonials_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES profiles(id) 
      ON DELETE CASCADE;
    
    RAISE NOTICE '✅ FK testimonials → profiles criada';
  END IF;
END $$;

-- ==========================================
-- MENSAGEM DE SUCESSO
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE '✅ 3 triggers críticos criados em auth.users com sucesso!';
  RAISE NOTICE '✅ FK testimonials → profiles criada (se não existia)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  LEMBRE-SE: Edite assign_admin_role() com SEU email de admin!';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '1. Substituir admin@example.com pelo seu email real';
  RAISE NOTICE '2. Testar criação de usuário';
  RAISE NOTICE '3. Verificar se perfil é criado automaticamente';
  RAISE NOTICE '4. Verificar se role é atribuída corretamente';
END $$;
