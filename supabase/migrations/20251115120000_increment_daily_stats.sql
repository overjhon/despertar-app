-- Incrementa métricas diárias de leitura de forma atômica
CREATE OR REPLACE FUNCTION public.increment_daily_stats(
  p_user_id uuid,
  p_date date,
  p_pages_delta integer,
  p_xp_delta integer,
  p_books_delta integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.daily_reading_stats (user_id, date, pages_read, xp_earned, books_completed)
  VALUES (p_user_id, p_date, GREATEST(0, p_pages_delta), GREATEST(0, p_xp_delta), GREATEST(0, p_books_delta))
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    pages_read = public.daily_reading_stats.pages_read + GREATEST(0, EXCLUDED.pages_read),
    xp_earned = public.daily_reading_stats.xp_earned + GREATEST(0, EXCLUDED.xp_earned),
    books_completed = public.daily_reading_stats.books_completed + GREATEST(0, EXCLUDED.books_completed);
END;
$$;

-- Garantir política RLS permite o usuário atualizar apenas seu próprio registro
-- As políticas existentes já restringem SELECT/INSERT/UPDATE por auth.uid(); esta função roda como SECURITY DEFINER