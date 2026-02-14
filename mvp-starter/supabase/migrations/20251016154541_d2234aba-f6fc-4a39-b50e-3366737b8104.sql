-- Fix function search_path for security
DROP FUNCTION IF EXISTS public.calculate_level(integer);
CREATE OR REPLACE FUNCTION public.calculate_level(xp integer)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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

DROP FUNCTION IF EXISTS public.get_level_name(integer);
CREATE OR REPLACE FUNCTION public.get_level_name(level integer)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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

DROP FUNCTION IF EXISTS public.get_xp_for_level(integer);
CREATE OR REPLACE FUNCTION public.get_xp_for_level(level integer)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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