-- =====================================================
-- MIGRAÇÃO: Funções Auxiliares e Triggers
-- =====================================================

-- Função: has_role
CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função: calculate_level
CREATE OR REPLACE FUNCTION calculate_level(xp integer)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF xp < 500 THEN RETURN 1;
  ELSIF xp < 1500 THEN RETURN 2;
  ELSIF xp < 3500 THEN RETURN 3;
  ELSIF xp < 7000 THEN RETURN 4;
  ELSIF xp < 15000 THEN RETURN 5;
  ELSIF xp < 30000 THEN RETURN 6;
  ELSE RETURN 7;
  END IF;
END;
$$;

-- Função: get_level_name
CREATE OR REPLACE FUNCTION get_level_name(level integer)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  CASE level
    WHEN 1 THEN RETURN 'Aprendiz';
    WHEN 2 THEN RETURN 'Leitor';
    WHEN 3 THEN RETURN 'Entusiasta';
    WHEN 4 THEN RETURN 'Conhecedor';
    WHEN 5 THEN RETURN 'Expert';
    WHEN 6 THEN RETURN 'Mestre';
    WHEN 7 THEN RETURN 'Lenda';
    ELSE RETURN 'Desconhecido';
  END CASE;
END;
$$;

-- Função: get_xp_for_level
CREATE OR REPLACE FUNCTION get_xp_for_level(level integer)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  CASE level
    WHEN 1 THEN RETURN 500;
    WHEN 2 THEN RETURN 1500;
    WHEN 3 THEN RETURN 3500;
    WHEN 4 THEN RETURN 7000;
    WHEN 5 THEN RETURN 15000;
    WHEN 6 THEN RETURN 30000;
    ELSE RETURN 30000;
  END CASE;
END;
$$;

-- Função: generate_referral_code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    code := UPPER(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referral_code = code) INTO exists_code;
    EXIT WHEN NOT exists_code;
  END LOOP;
  RETURN code;
END;
$$;

-- Função: create_notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type varchar,
  p_title varchar,
  p_message text,
  p_link varchar DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_metadata)
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$;

-- Função: check_rate_limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier text,
  p_action text,
  p_max_attempts integer,
  p_window_minutes integer,
  p_block_minutes integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_record RECORD;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_window_start TIMESTAMP WITH TIME ZONE := v_now - (p_window_minutes || ' minutes')::INTERVAL;
BEGIN
  SELECT * INTO v_record
  FROM public.rate_limit_attempts
  WHERE identifier = p_identifier AND action = p_action
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.rate_limit_attempts (identifier, action, attempts, window_start)
    VALUES (p_identifier, p_action, 1, v_now);

    RETURN jsonb_build_object(
      'allowed', true,
      'blocked', false,
      'attempts_left', p_max_attempts - 1
    );
  END IF;

  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > v_now THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'remaining_seconds', EXTRACT(EPOCH FROM (v_record.blocked_until - v_now))::INTEGER,
      'attempts_left', 0
    );
  END IF;

  IF v_record.window_start IS NULL OR v_record.window_start < v_window_start THEN
    UPDATE public.rate_limit_attempts
    SET attempts = 1,
        window_start = v_now,
        blocked_until = NULL,
        updated_at = v_now
    WHERE identifier = p_identifier AND action = p_action;

    RETURN jsonb_build_object(
      'allowed', true,
      'blocked', false,
      'attempts_left', p_max_attempts - 1
    );
  END IF;

  IF v_record.attempts >= p_max_attempts THEN
    UPDATE public.rate_limit_attempts
    SET blocked_until = v_now + (p_block_minutes || ' minutes')::INTERVAL,
        updated_at = v_now
    WHERE identifier = p_identifier AND action = p_action;

    RETURN jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'remaining_seconds', p_block_minutes * 60,
      'attempts_left', 0
    );
  END IF;

  UPDATE public.rate_limit_attempts
  SET attempts = attempts + 1,
      updated_at = v_now
  WHERE identifier = p_identifier AND action = p_action;

  RETURN jsonb_build_object(
    'allowed', true,
    'blocked', false,
    'attempts_left', p_max_attempts - (v_record.attempts + 1)
  );
END;
$$;

-- Triggers para contadores automáticos

-- Trigger: Atualizar likes em posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_post_likes_count_on_insert ON post_likes;
CREATE TRIGGER update_post_likes_count_on_insert
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

DROP TRIGGER IF EXISTS update_post_likes_count_on_delete ON post_likes;
CREATE TRIGGER update_post_likes_count_on_delete
  AFTER DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- Trigger: Atualizar comentários em posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_post_comments_count_on_insert ON post_comments;
CREATE TRIGGER update_post_comments_count_on_insert
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

DROP TRIGGER IF EXISTS update_post_comments_count_on_delete ON post_comments;
CREATE TRIGGER update_post_comments_count_on_delete
  AFTER DELETE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- Trigger: Criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ✅ Funções e Triggers criados com sucesso!

