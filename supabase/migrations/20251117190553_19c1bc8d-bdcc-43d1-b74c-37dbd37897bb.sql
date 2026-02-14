-- Sistema de Licenciamento Whitelabel
-- Tabela de licenças
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT UNIQUE NOT NULL,
  owner_email TEXT NOT NULL,
  owner_name TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, suspended, expired
  allowed_domains TEXT[] NOT NULL DEFAULT '{}',
  max_users INTEGER DEFAULT NULL, -- NULL = ilimitado
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de uso de licenças (telemetria)
CREATE TABLE IF NOT EXISTS public.license_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT NOT NULL,
  domain TEXT NOT NULL,
  user_count INTEGER DEFAULT 0,
  last_check_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(license_key, domain)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_licenses_key ON public.licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON public.licenses(status);
CREATE INDEX IF NOT EXISTS idx_license_usage_key ON public.license_usage(license_key);

-- Função para extrair hostname de uma URL/Origin
CREATE OR REPLACE FUNCTION public.extract_hostname(p_origin TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hostname TEXT;
BEGIN
  -- Remove protocolo e porta
  v_hostname := regexp_replace(p_origin, '^https?://', '', 'i');
  v_hostname := regexp_replace(v_hostname, ':\d+$', '');
  v_hostname := split_part(v_hostname, '/', 1);
  RETURN lower(v_hostname);
END;
$$;

-- Função para validar licença por domínio
CREATE OR REPLACE FUNCTION public.validate_license(p_license_key TEXT, p_origin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_license RECORD;
  v_hostname TEXT;
BEGIN
  -- Extrair hostname do origin
  v_hostname := extract_hostname(p_origin);
  
  -- Buscar licença
  SELECT * INTO v_license 
  FROM public.licenses 
  WHERE license_key = p_license_key 
  AND status = 'active'
  AND (expires_at IS NULL OR expires_at > NOW());
  
  -- Se licença não existe ou inválida, retornar false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se domínio está na lista permitida
  IF v_hostname = ANY(v_license.allowed_domains) THEN
    -- Atualizar telemetria de uso
    INSERT INTO public.license_usage (license_key, domain, last_check_at)
    VALUES (p_license_key, v_hostname, NOW())
    ON CONFLICT (license_key, domain) 
    DO UPDATE SET last_check_at = NOW();
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.extract_hostname TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_license TO anon, authenticated;

-- RLS para licenses (somente admins podem ver)
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage licenses"
  ON public.licenses
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS para license_usage (somente admins)
ALTER TABLE public.license_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view license usage"
  ON public.license_usage
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));