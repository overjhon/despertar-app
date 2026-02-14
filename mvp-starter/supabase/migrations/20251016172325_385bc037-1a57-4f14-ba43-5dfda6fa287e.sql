-- Add price columns to ebooks table
ALTER TABLE ebooks
ADD COLUMN IF NOT EXISTS purchase_url TEXT,
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS current_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER;

-- Update existing ebooks with purchase data
-- Velas que Vendem
UPDATE ebooks 
SET 
  purchase_url = 'https://pay.cakto.com.br/3fsvrq2_608236',
  original_price = 67.00,
  current_price = 37.00,
  discount_percentage = 45
WHERE id = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

-- Velas Terapêuticas
UPDATE ebooks 
SET 
  purchase_url = 'https://pay.cakto.com.br/hpgcp3n_609900',
  original_price = 39.90,
  current_price = 19.90,
  discount_percentage = 50
WHERE id = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

-- Velas Sazonais
UPDATE ebooks 
SET 
  purchase_url = 'https://pay.cakto.com.br/yk4zc92_609798',
  original_price = 49.90,
  current_price = 19.90,
  discount_percentage = 60
WHERE id = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

-- 50 Receitas Gourmet
UPDATE ebooks 
SET 
  purchase_url = 'https://pay.cakto.com.br/qozn9ip_609893',
  original_price = 57.00,
  current_price = 19.90,
  discount_percentage = 65
WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- Create table for tracking purchase clicks
CREATE TABLE IF NOT EXISTS purchase_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on purchase_clicks
ALTER TABLE purchase_clicks ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Users can track own clicks" ON purchase_clicks;
DROP POLICY IF EXISTS "Users can view own clicks" ON purchase_clicks;

-- Users can insert their own clicks
CREATE POLICY "Users can track own clicks"
ON purchase_clicks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view own clicks
CREATE POLICY "Users can view own clicks"
ON purchase_clicks
FOR SELECT
USING (auth.uid() = user_id);

-- Create purchase badges with proper UUIDs
INSERT INTO badges (id, name, description, icon, category, xp_reward, criteria)
VALUES
  (gen_random_uuid(), 'Investidora', 'Comprou seu primeiro ebook', '💎', 'special', 100, '{"type": "purchase_count", "value": 1}'),
  (gen_random_uuid(), 'Colecionadora', 'Comprou 3 ebooks', '📚', 'special', 300, '{"type": "purchase_count", "value": 3}'),
  (gen_random_uuid(), 'Mestra das Velas', 'Completou a coleção (4 ebooks)', '👑', 'special', 500, '{"type": "purchase_count", "value": 4}')
ON CONFLICT DO NOTHING;