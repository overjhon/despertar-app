-- Função transacional para adicionar XP de forma segura
CREATE OR REPLACE FUNCTION public.add_xp_atomic(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_related_ebook_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS TABLE(new_xp integer, new_level integer, level_up boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current RECORD;
  v_new_xp integer;
  v_old_level integer;
  v_new_level integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid XP amount';
  END IF;

  -- Bloqueia a linha do usuário para atualização concorrente
  SELECT * INTO v_current
  FROM public.user_gamification
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Inicializa registro se não existir
    INSERT INTO public.user_gamification(user_id)
    VALUES (p_user_id);
    SELECT * INTO v_current
    FROM public.user_gamification
    WHERE user_id = p_user_id
    FOR UPDATE;
  END IF;

  v_new_xp := v_current.total_xp + p_amount;
  v_old_level := v_current.current_level;
  v_new_level := public.calculate_level(v_new_xp);

  UPDATE public.user_gamification
  SET total_xp = v_new_xp,
      current_level = v_new_level,
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.xp_transactions(user_id, xp_amount, reason, related_ebook_id, metadata)
  VALUES (p_user_id, p_amount, p_reason, p_related_ebook_id, p_metadata);

  RETURN QUERY SELECT v_new_xp, v_new_level, (v_new_level > v_old_level);
END;
$$;