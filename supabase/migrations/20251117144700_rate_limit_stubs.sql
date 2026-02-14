create or replace function public.reset_rate_limit(
  p_identifier text
) returns boolean
language plpgsql
security definer
as $$
begin
  return true;
end;
$$;