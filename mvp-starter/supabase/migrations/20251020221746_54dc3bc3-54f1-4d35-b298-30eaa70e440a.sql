-- Adicionar rastreamento de recompensa de instalação no banco de dados

-- Adicionar coluna para rastrear se usuário já recebeu recompensa de instalação
ALTER TABLE user_gamification 
ADD COLUMN IF NOT EXISTS install_reward_claimed BOOLEAN DEFAULT false;