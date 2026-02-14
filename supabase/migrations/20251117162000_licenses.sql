create extension if not exists pgcrypto;

create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  license_key text unique not null,
  allowed_domains text[] not null default array[]::text[],
  status text not null default 'active',
  issued_at timestamptz default now()
);

create or replace function public.extract_hostname(p_origin text)
returns text
language plpgsql
as $$
declare
  host text;
begin
  -- Remove protocolo e caminho
  -- Ex.: https://example.com -> example.com
  host := regexp_replace(p_origin, '^https?://', '');
  host := split_part(host, '/', 1);
  return lower(host);
end;
$$;

create or replace function public.validate_license(p_license_key text, p_origin text)
returns boolean
language plpgsql
security definer
stable
as $$
declare
  host text := public.extract_hostname(p_origin);
  ok boolean := false;
begin
  select true into ok
  from public.licenses l
  where l.license_key = p_license_key
    and l.status = 'active'
    and (host = any(l.allowed_domains));

  return coalesce(ok, false);
end;
$$;

grant execute on function public.validate_license(text, text) to anon, authenticated;