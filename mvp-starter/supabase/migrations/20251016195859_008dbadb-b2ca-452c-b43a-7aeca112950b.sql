-- Popular tabela de rewards com recompensas iniciais usando tipos corretos
INSERT INTO public.rewards (name, description, type, required_level, required_xp, required_badge_id, badge_id, ebook_id, metadata, is_active)
VALUES
  -- Recompensas de Badges Exclusivos por Nível
  (
    'Badge de Perfil Avançado',
    'Desbloqueie o badge especial de Perfil Avançado ao atingir nível 3',
    'badge_exclusive',
    3,
    NULL,
    NULL,
    (SELECT id FROM public.badges WHERE name = 'Leitor Entusiasta' LIMIT 1),
    NULL,
    '{"unlock_type": "level", "level_required": 3, "benefit": "Destaque visual no perfil"}',
    true
  ),
  (
    'Badge de Destaque no Ranking',
    'Desbloqueie o badge de Destaque no Ranking ao atingir nível 5',
    'badge_exclusive',
    5,
    NULL,
    NULL,
    (SELECT id FROM public.badges WHERE name = 'Conhecedor' LIMIT 1),
    NULL,
    '{"unlock_type": "level", "level_required": 5, "benefit": "Aparece destacado nos rankings"}',
    true
  ),
  (
    'Badge VIP Elite',
    'Desbloqueie o badge VIP Elite ao atingir o nível máximo',
    'badge_exclusive',
    7,
    NULL,
    NULL,
    (SELECT id FROM public.badges WHERE name = 'Expert Leitor' LIMIT 1),
    NULL,
    '{"unlock_type": "level", "level_required": 7, "benefit": "Acesso antecipado a novos ebooks"}',
    true
  ),
  
  -- Boost de XP por Conquistas
  (
    'Boost de XP Bronze',
    'Ganhe 20% mais XP em todas as leituras após acumular 1500 XP',
    'xp_boost',
    NULL,
    1500,
    NULL,
    NULL,
    NULL,
    '{"boost_percentage": 20, "tier": "bronze", "unlock_type": "xp"}',
    true
  ),
  (
    'Boost de XP Prata',
    'Ganhe 35% mais XP em todas as leituras após acumular 7000 XP',
    'xp_boost',
    NULL,
    7000,
    NULL,
    NULL,
    NULL,
    '{"boost_percentage": 35, "tier": "silver", "unlock_type": "xp"}',
    true
  ),
  (
    'Boost de XP Ouro',
    'Ganhe 50% mais XP em todas as leituras após acumular 15000 XP',
    'xp_boost',
    NULL,
    15000,
    NULL,
    NULL,
    NULL,
    '{"boost_percentage": 50, "tier": "gold", "unlock_type": "xp"}',
    true
  ),
  
  -- Recompensas Personalizadas por Badges
  (
    'Desconto Especial - Maratonista',
    'Ganhe 10% de desconto permanente após completar 5 livros',
    'custom',
    NULL,
    NULL,
    (SELECT id FROM public.badges WHERE name = 'Maratonista' LIMIT 1),
    NULL,
    NULL,
    '{"reward_type": "discount", "discount_percentage": 10, "achievement_type": "books_completed"}',
    true
  ),
  (
    'Benefício de Chama Eterna',
    'Ganhe um ebook grátis ao manter 30 dias de sequência',
    'custom',
    NULL,
    NULL,
    (SELECT id FROM public.badges WHERE name = 'Chama de 30 dias' LIMIT 1),
    NULL,
    NULL,
    '{"reward_type": "free_ebook", "achievement_type": "streak", "quantity": 1}',
    true
  ),
  (
    'Acesso Premium Temporário',
    'Desbloqueie 7 dias de acesso premium ao ser Expert',
    'custom',
    5,
    NULL,
    NULL,
    NULL,
    NULL,
    '{"reward_type": "premium_access", "duration_days": 7, "unlock_type": "level"}',
    true
  );