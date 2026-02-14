-- Adicionar novas colunas na tabela user_gamification
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS total_pages_read INTEGER DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS total_reading_time_minutes INTEGER DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS books_completed INTEGER DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS best_daily_pages INTEGER DEFAULT 0;

-- Criar tabela de estatísticas diárias
CREATE TABLE IF NOT EXISTS daily_reading_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  pages_read INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 0,
  books_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Habilitar RLS
ALTER TABLE daily_reading_stats ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para daily_reading_stats
CREATE POLICY "Users can view own daily stats"
ON daily_reading_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily stats"
ON daily_reading_stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily stats"
ON daily_reading_stats FOR UPDATE
USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_reading_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_reading_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_pages ON daily_reading_stats(pages_read DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_xp ON daily_reading_stats(xp_earned DESC);

-- Índices adicionais em user_gamification para rankings
CREATE INDEX IF NOT EXISTS idx_gamification_total_pages ON user_gamification(total_pages_read DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_reading_time ON user_gamification(total_reading_time_minutes DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_books_completed ON user_gamification(books_completed DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_best_daily ON user_gamification(best_daily_pages DESC);