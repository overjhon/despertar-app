-- Corrigir search_path na função get_user_id_by_email
CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = LOWER(TRIM(user_email));
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;