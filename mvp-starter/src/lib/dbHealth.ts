import { supabase } from '@/integrations/supabase/client';

export interface HealthResult {
  ok: boolean;
  ms: number;
  status?: number;
  error?: string;
  url?: string;
  anonKeyPresent?: boolean;
}

export async function checkSupabaseClientHealth(): Promise<HealthResult> {
  const start = Date.now();
  try {
    const { data, error } = await supabase
      .from('ebooks')
      .select('id')
      .limit(1);

    const ms = Date.now() - start;
    if (error) {
      return {
        ok: false,
        ms,
        error: error.message || String(error),
        url: import.meta.env.VITE_SUPABASE_URL,
        anonKeyPresent: Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
      };
    }

    return {
      ok: true,
      ms,
      url: import.meta.env.VITE_SUPABASE_URL,
      anonKeyPresent: Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
    };
  } catch (e: any) {
    return {
      ok: false,
      ms: Date.now() - start,
      error: e?.message || String(e),
      url: import.meta.env.VITE_SUPABASE_URL,
      anonKeyPresent: Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
    };
  }
}

export async function checkPostgrestHealth(): Promise<HealthResult> {
  const start = Date.now();
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!baseUrl) {
    return { ok: false, ms: 0, error: 'VITE_SUPABASE_URL ausente', anonKeyPresent: Boolean(anon) };
  }
  const url = `${baseUrl}/rest/v1/ebooks?select=id&limit=1`;
  try {
    const res = await fetch(url, {
      headers: {
        apikey: anon ?? '',
        Authorization: `Bearer ${anon ?? ''}`,
        Accept: 'application/json',
      },
      method: 'GET',
    });
    const ms = Date.now() - start;
    const ok = res.status >= 200 && res.status < 300;
    return { ok, ms, status: res.status, url: baseUrl, anonKeyPresent: Boolean(anon) };
  } catch (e: any) {
    return {
      ok: false,
      ms: Date.now() - start,
      error: e?.message || String(e),
      url: baseUrl,
      anonKeyPresent: Boolean(anon),
    };
  }
}