-- Adicionar coluna email na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Popular com dados existentes do auth.users
UPDATE profiles p
SET email = (
  SELECT email FROM auth.users WHERE id = p.id
)
WHERE email IS NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Criar função RPC para buscar user_id por email
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para manter email sincronizado quando usuário atualiza
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET email = NEW.email 
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION sync_profile_email();