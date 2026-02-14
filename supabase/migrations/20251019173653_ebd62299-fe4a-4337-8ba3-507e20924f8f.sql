-- Criar funções para incrementar/decrementar contadores automaticamente

-- Função para incrementar comments_count
CREATE OR REPLACE FUNCTION public.inc_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.community_posts
  SET comments_count = comments_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

-- Função para decrementar comments_count
CREATE OR REPLACE FUNCTION public.dec_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.community_posts
  SET comments_count = GREATEST(comments_count - 1, 0)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

-- Função para incrementar likes_count
CREATE OR REPLACE FUNCTION public.inc_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.community_posts
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

-- Função para decrementar likes_count
CREATE OR REPLACE FUNCTION public.dec_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.community_posts
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

-- Criar triggers para post_comments
CREATE TRIGGER trg_post_comments_inc
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE PROCEDURE public.inc_comments_count();

CREATE TRIGGER trg_post_comments_dec
AFTER DELETE ON public.post_comments
FOR EACH ROW
EXECUTE PROCEDURE public.dec_comments_count();

-- Criar triggers para post_likes
CREATE TRIGGER trg_post_likes_inc
AFTER INSERT ON public.post_likes
FOR EACH ROW
EXECUTE PROCEDURE public.inc_likes_count();

CREATE TRIGGER trg_post_likes_dec
AFTER DELETE ON public.post_likes
FOR EACH ROW
EXECUTE PROCEDURE public.dec_likes_count();

-- Backfill: recalcular contadores existentes
UPDATE public.community_posts p
SET comments_count = COALESCE(c.cnt, 0)
FROM (
  SELECT post_id, COUNT(*) as cnt
  FROM public.post_comments
  GROUP BY post_id
) c
WHERE p.id = c.post_id;

UPDATE public.community_posts p
SET likes_count = COALESCE(l.cnt, 0)
FROM (
  SELECT post_id, COUNT(*) as cnt
  FROM public.post_likes
  GROUP BY post_id
) l
WHERE p.id = l.post_id;