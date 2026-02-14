-- Corrigir constraint de notificações e adicionar tipos faltantes

-- Remover constraint antiga
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Adicionar constraint com todos os tipos necessários
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'level_up', 
  'badge_earned', 
  'challenge_completed', 
  'challenge_new', 
  'follow', 
  'like', 
  'comment', 
  'system',
  'purchase',
  'reward',
  'achievement',
  'streak'
));