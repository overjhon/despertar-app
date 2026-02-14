-- FASE 2.1: Remover programa Beta
DROP TABLE IF EXISTS beta_testers CASCADE;

-- FASE 2.2: Adicionar colunas de recompensas ao sistema de referrals
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS reward_type text,
ADD COLUMN IF NOT EXISTS reward_ebook_id uuid REFERENCES ebooks(id),
ADD COLUMN IF NOT EXISTS reward_claimed_at timestamp with time zone;