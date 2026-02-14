-- ==========================================
-- SCRIPT DE VERIFICAÇÃO DE INTEGRIDADE
-- ==========================================
-- Execute este script no SQL Editor do Lovable Cloud após importar o projeto
-- Ele valida se todos os componentes críticos foram criados corretamente

DO $$
DECLARE
  trigger_count INT;
  badge_count INT;
  profile_count INT;
  user_count INT;
  function_count INT;
  missing_profiles INT;
  table_count INT;
  v_result TEXT := '';
BEGIN
  v_result := E'\n=== 🔍 VERIFICAÇÃO DE INTEGRIDADE DO BANCO ===\n\n';

  -- ==========================================
  -- 1. VERIFICAR TRIGGERS EM AUTH.USERS
  -- ==========================================
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'auth' 
    AND c.relname = 'users'
    AND t.tgname IN (
      'on_auth_user_created',
      'on_auth_user_created_assign_role',
      'on_auth_user_email_updated'
    );

  IF trigger_count < 3 THEN
    v_result := v_result || E'❌ CRÍTICO: Faltam triggers! Encontrados: ' || trigger_count || '/3\n';
    v_result := v_result || E'   → Execute: supabase/migrations/00000000000002_critical_triggers_fix.sql\n\n';
  ELSE
    v_result := v_result || E'✅ Triggers OK (' || trigger_count || '/3)\n\n';
  END IF;

  -- ==========================================
  -- 2. VERIFICAR BADGES
  -- ==========================================
  SELECT COUNT(*) INTO badge_count FROM badges;

  IF badge_count < 10 THEN
    v_result := v_result || E'⚠️  Badges insuficientes! Encontrados: ' || badge_count || ' (mínimo: 10)\n';
    v_result := v_result || E'   → Execute: supabase/migrations/00000000000003_seed_initial_badges.sql\n\n';
  ELSE
    v_result := v_result || E'✅ Badges OK (' || badge_count || ')\n\n';
  END IF;

  -- ==========================================
  -- 3. VERIFICAR CONSISTÊNCIA PROFILES/USERS
  -- ==========================================
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM profiles;
  missing_profiles := user_count - profile_count;

  IF missing_profiles > 0 THEN
    v_result := v_result || E'❌ CRÍTICO: ' || missing_profiles || ' usuários sem perfil!\n';
    v_result := v_result || E'   Usuários: ' || user_count || ' | Perfis: ' || profile_count || E'\n';
    v_result := v_result || E'   → Corrija executando:\n';
    v_result := v_result || E'     INSERT INTO profiles (id, full_name, email)\n';
    v_result := v_result || E'     SELECT id, COALESCE(raw_user_meta_data->>''full_name'', ''Usuário''), email\n';
    v_result := v_result || E'     FROM auth.users\n';
    v_result := v_result || E'     WHERE id NOT IN (SELECT id FROM profiles);\n\n';
  ELSE
    v_result := v_result || E'✅ Profiles/Users consistentes (' || profile_count || ')\n\n';
  END IF;

  -- ==========================================
  -- 4. VERIFICAR FUNÇÕES CRÍTICAS
  -- ==========================================
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'has_role',
      'handle_new_user',
      'assign_admin_role',
      'sync_profile_email',
      'calculate_level',
      'get_level_name',
      'get_xp_for_level',
      'update_updated_at_column',
      'update_testimonial_likes_count',
      'update_testimonial_comments_count',
      'update_post_likes_count',
      'update_post_comments_count',
      'create_notification',
      'check_rate_limit',
      'reset_rate_limit',
      'get_user_id_by_email',
      'validate_license',
      'extract_hostname',
      'get_ebook_id_for_product',
      'generate_referral_code',
      'update_creation_likes_count',
      'mark_question_answered'
    );

  IF function_count < 6 THEN
    v_result := v_result || E'⚠️  Funções faltando: ' || function_count || '/20\n';
    v_result := v_result || E'   → Execute: docs/DATABASE_COMPLETE.sql\n\n';
  ELSE
    v_result := v_result || E'✅ Funções essenciais OK (' || function_count || '/20)\n\n';
  END IF;

  -- ==========================================
  -- 5. VERIFICAR TABELAS PRINCIPAIS
  -- ==========================================
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';

  IF table_count < 25 THEN
    v_result := v_result || E'⚠️  Tabelas insuficientes: ' || table_count || ' (esperado: 30+)\n';
    v_result := v_result || E'   → Execute: docs/DATABASE_COMPLETE.sql\n\n';
  ELSE
    v_result := v_result || E'✅ Tabelas principais OK (' || table_count || ')\n\n';
  END IF;

  -- Verificar tabelas específicas críticas
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_gamification') THEN
    v_result := v_result || E'❌ Tabela user_gamification não existe!\n';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    v_result := v_result || E'❌ Tabela user_roles não existe!\n';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badges') THEN
    v_result := v_result || E'❌ Tabela badges não existe!\n';
  END IF;

  -- ==========================================
  -- 6. VERIFICAR STORAGE BUCKETS (informativo)
  -- ==========================================
  v_result := v_result || E'\n📦 STORAGE BUCKETS:\n';
  v_result := v_result || E'   Verifique manualmente no Lovable Cloud → Storage:\n';
  v_result := v_result || E'   - [ ] avatars (public)\n';
  v_result := v_result || E'   - [ ] covers (public)\n';
  v_result := v_result || E'   - [ ] samples (public)\n';
  v_result := v_result || E'   - [ ] ebooks (private)\n';
  v_result := v_result || E'   - [ ] community-media (public)\n\n';

  -- ==========================================
  -- 7. VERIFICAR EDGE FUNCTIONS (informativo)
  -- ==========================================
  v_result := v_result || E'🚀 EDGE FUNCTIONS:\n';
  v_result := v_result || E'   Verifique manualmente no Lovable Cloud → Edge Functions:\n';
  v_result := v_result || E'   - [ ] handle-purchase (deployed)\n';
  v_result := v_result || E'   - [ ] claim-purchases (deployed)\n';
  v_result := v_result || E'   - [ ] moderate-content (deployed)\n';
  v_result := v_result || E'   - [ ] process-referral (deployed)\n';
  v_result := v_result || E'   - [ ] process-referral-reward (deployed)\n';
  v_result := v_result || E'   - [ ] seed-database (deployed)\n';
  v_result := v_result || E'   - [ ] send-push (deployed)\n';
  v_result := v_result || E'   - [ ] send-test-webhook (deployed)\n\n';

  -- ==========================================
  -- 8. VERIFICAR SECRETS (informativo)
  -- ==========================================
  v_result := v_result || E'🔐 SECRETS:\n';
  v_result := v_result || E'   Verifique manualmente no Lovable Cloud → Settings → Edge Functions → Secrets:\n';
  v_result := v_result || E'   - [ ] SUPABASE_URL\n';
  v_result := v_result || E'   - [ ] SUPABASE_ANON_KEY\n';
  v_result := v_result || E'   - [ ] SUPABASE_SERVICE_ROLE_KEY\n';
  v_result := v_result || E'   - [ ] LOVABLE_API_KEY\n\n';

  -- ==========================================
  -- RESULTADO FINAL
  -- ==========================================
  v_result := v_result || E'=== 📊 RESUMO ===\n';
  
  IF trigger_count = 3 AND badge_count >= 10 AND missing_profiles = 0 AND function_count >= 6 AND table_count >= 25 THEN
    v_result := v_result || E'✅ BANCO 100% FUNCIONAL!\n\n';
    v_result := v_result || E'Próximos passos:\n';
    v_result := v_result || E'1. Verificar storage buckets (5 esperados)\n';
    v_result := v_result || E'2. Verificar edge functions (8 esperadas)\n';
    v_result := v_result || E'3. Verificar secrets (4 esperados)\n';
    v_result := v_result || E'4. Testar criação de usuário\n';
    v_result := v_result || E'5. Fazer deploy do app\n';
  ELSE
    v_result := v_result || E'⚠️  AÇÕES NECESSÁRIAS (ver acima)\n';
    v_result := v_result || E'\nApós corrigir, execute este script novamente.\n';
  END IF;

  RAISE NOTICE '%', v_result;
END $$;

-- ==========================================
-- COMANDOS ÚTEIS PARA DEBUG
-- ==========================================

-- Ver todos os triggers em auth.users:
-- SELECT tgname FROM pg_trigger t
-- JOIN pg_class c ON t.tgrelid = c.oid
-- JOIN pg_namespace n ON c.relnamespace = n.oid
-- WHERE n.nspname = 'auth' AND c.relname = 'users';

-- Ver todas as funções em public:
-- SELECT proname FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
-- ORDER BY proname;

-- Ver todas as tabelas:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;

-- Ver usuários sem perfil:
-- SELECT u.id, u.email
-- FROM auth.users u
-- LEFT JOIN profiles p ON u.id = p.id
-- WHERE p.id IS NULL;

-- Ver quantidade de badges:
-- SELECT COUNT(*), category FROM badges GROUP BY category;

-- Ver roles dos usuários:
-- SELECT u.email, ur.role
-- FROM auth.users u
-- JOIN user_roles ur ON u.id = ur.user_id
-- ORDER BY u.email;
