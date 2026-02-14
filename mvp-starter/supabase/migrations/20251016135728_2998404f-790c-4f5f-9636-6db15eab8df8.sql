-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Criar tabela user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função security definer para verificar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Políticas RLS para user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger para atribuir role admin ao email específico
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ⚠️ CUSTOMIZE: Substitua 'admin@example.com' pelo email do primeiro admin
  IF NEW.email = 'admin@example.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Outros usuários recebem role 'user' por padrão
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger para atribuir roles automaticamente
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_role();

-- Atualizar políticas RLS dos buckets de storage para admin
DROP POLICY IF EXISTS "Admin can upload to ebooks" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload to covers" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload to samples" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update files" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete files" ON storage.objects;

-- Novas políticas baseadas em role admin
CREATE POLICY "Admin can upload to ebooks"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ebooks' AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can upload to covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can upload to samples"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'samples' AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can update files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('ebooks', 'covers', 'samples') AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id IN ('ebooks', 'covers', 'samples') AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('ebooks', 'covers', 'samples') AND public.has_role(auth.uid(), 'admin')
);