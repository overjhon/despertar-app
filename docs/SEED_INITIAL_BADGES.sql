-- ==========================================
-- DADOS INICIAIS: BADGES DO SISTEMA
-- ==========================================
-- Esta migration é IDEMPOTENTE - pode executar múltiplas vezes
-- Popula a tabela badges com os badges padrão do sistema de gamificação
--
-- QUANDO EXECUTAR:
-- - Após criar o banco de dados (DATABASE_COMPLETE.sql)
-- - Se a tabela badges estiver vazia
-- - Se o script VERIFY_MIGRATION.sql mostrar badges insuficientes

-- ==========================================
-- VALIDAÇÃO: Garantir que tabela badges existe
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badges') THEN
    RAISE EXCEPTION '❌ Tabela badges não existe! Execute docs/DATABASE_COMPLETE.sql primeiro.';
  END IF;
END $$;

-- ==========================================
-- INSERIR BADGES PADRÃO
-- ==========================================
-- Usa ON CONFLICT para ser idempotente (não duplica se executar múltiplas vezes)

INSERT INTO badges (name, description, icon, category, xp_reward, criteria) VALUES

  -- ==========================================
  -- READING BADGES (Leitura)
  -- ==========================================
  ('Primeira Leitura', 'Leu seu primeiro ebook', '📖', 'reading', 50, '{"type": "first_read"}'),
  ('Leitor Iniciante', 'Leu 10 páginas', '📚', 'reading', 100, '{"type": "pages_read", "count": 10}'),
  ('Leitor Dedicado', 'Leu 100 páginas', '📗', 'reading', 200, '{"type": "pages_read", "count": 100}'),
  ('Maratonista', 'Completou 5 ebooks', '🏃‍♀️', 'reading', 300, '{"type": "ebooks_completed", "count": 5}'),
  ('Mestre dos Livros', 'Completou 10 ebooks', '🏆', 'reading', 500, '{"type": "ebooks_completed", "count": 10}'),
  ('Expert Leitor', 'Alcançou o nível 7', '👑', 'reading', 1000, '{"type": "reach_level", "level": 7}'),
  ('Velocista', 'Completou um ebook em menos de 48h', '⚡', 'reading', 300, '{"type": "completion_time_hours", "max": 48}'),

  -- ==========================================
  -- STREAK BADGES (Sequências)
  -- ==========================================
  ('Chama de 3 dias', 'Manteve sequência de 3 dias', '🔥', 'reading', 75, '{"type": "streak", "days": 3}'),
  ('Chama de 7 dias', 'Manteve sequência de 7 dias', '🔥🔥', 'reading', 150, '{"type": "streak", "days": 7}'),
  ('Chama de 30 dias', 'Manteve sequência de 30 dias', '🔥🔥🔥', 'reading', 500, '{"type": "streak", "days": 30}'),
  ('Chama Eterna', 'Manteve sequência de 100 dias', '♾️', 'reading', 2000, '{"type": "streak", "days": 100}'),

  -- ==========================================
  -- PURCHASE BADGES (Compras)
  -- ==========================================
  ('Investidora', 'Comprou seu primeiro ebook', '💎', 'special', 100, '{"type": "purchase_count", "count": 1}'),
  ('Colecionadora', 'Comprou 3 ebooks', '📚', 'special', 300, '{"type": "purchase_count", "count": 3}'),
  ('Mestra das Velas', 'Comprou a coleção completa (4 ebooks)', '👑', 'special', 500, '{"type": "purchase_count", "count": 4}'),

  -- ==========================================
  -- COMMUNITY BADGES (Comunidade)
  -- ==========================================
  ('Social', 'Fez seu primeiro post na comunidade', '💬', 'community', 50, '{"type": "first_post"}'),
  ('Comunicador', 'Fez 10 posts', '📢', 'community', 250, '{"type": "posts_count", "count": 10}'),
  ('Influenciador', 'Recebeu 100 curtidas totais', '⭐', 'community', 500, '{"type": "total_likes_received", "count": 100}'),
  ('Criador', 'Compartilhou sua primeira criação', '✨', 'community', 100, '{"type": "first_creation"}'),
  ('Artista', 'Compartilhou 10 criações', '🎨', 'community', 400, '{"type": "creations_count", "count": 10}'),

  -- ==========================================
  -- SPECIAL BADGES (Especiais)
  -- ==========================================
  ('Instalador', 'Instalou o app no dispositivo', '📱', 'special', 100, '{"type": "install_app"}'),
  ('Early Bird', 'Leu antes das 7h (10 vezes)', '☀️', 'special', 150, '{"type": "reading_time", "before": "07:00", "count": 10}'),
  ('Night Owl', 'Leu após 22h (10 vezes)', '🌙', 'special', 150, '{"type": "reading_time", "after": "22:00", "count": 10}'),
  ('Explorador', 'Leu ebooks de 3 categorias diferentes', '🌍', 'reading', 250, '{"type": "categories", "count": 3}'),
  ('Indicador', 'Indicou um amigo que fez compra', '🤝', 'special', 200, '{"type": "successful_referral"}')

ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  xp_reward = EXCLUDED.xp_reward,
  criteria = EXCLUDED.criteria,
  category = EXCLUDED.category;

-- ==========================================
-- VERIFICAR QUANTOS BADGES FORAM CRIADOS
-- ==========================================
DO $$
DECLARE
  badge_count INT;
  reading_count INT;
  community_count INT;
  special_count INT;
BEGIN
  SELECT COUNT(*) INTO badge_count FROM badges;
  SELECT COUNT(*) INTO reading_count FROM badges WHERE category = 'reading';
  SELECT COUNT(*) INTO community_count FROM badges WHERE category = 'community';
  SELECT COUNT(*) INTO special_count FROM badges WHERE category = 'special';
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Badges criados/atualizados com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Estatísticas:';
  RAISE NOTICE '   Total: % badges', badge_count;
  RAISE NOTICE '   📖 Reading: % badges', reading_count;
  RAISE NOTICE '   💬 Community: % badges', community_count;
  RAISE NOTICE '   ⭐ Special: % badges', special_count;
  RAISE NOTICE '';
  
  IF badge_count >= 20 THEN
    RAISE NOTICE '✅ Sistema de badges COMPLETO!';
  ELSIF badge_count >= 10 THEN
    RAISE NOTICE '✅ Sistema de badges funcional (mínimo atingido)';
  ELSE
    RAISE WARNING '⚠️  Apenas % badges encontrados. Esperado: 20+', badge_count;
  END IF;
END $$;

-- ==========================================
-- ADICIONAR COMENTÁRIO NA TABELA
-- ==========================================
COMMENT ON TABLE badges IS 
'Badges do sistema de gamificação. Não remover badges padrão criados por SEED_INITIAL_BADGES.sql';

-- ==========================================
-- MENSAGEM FINAL
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '1. Verificar badges no Table Editor (badges)';
  RAISE NOTICE '2. Testar sistema de XP criando usuário';
  RAISE NOTICE '3. Ler algumas páginas e verificar se badges são conquistados';
  RAISE NOTICE '4. Executar VERIFY_MIGRATION.sql para validar tudo';
END $$;
