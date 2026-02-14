import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface Body {
  url: string;
  secret?: string;
}

const json = (d: any, i: ResponseInit = {}) => new Response(JSON.stringify(d), { ...i, headers: { 'Content-Type': 'application/json', ...(i.headers || {}) } });

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });
    const body = await req.json() as Body;
    if (!body.url) return json({ error: 'Missing url' }, { status: 400 });
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (body.secret) headers['X-Webhook-Token'] = body.secret;
    const res = await fetch(body.url, { method: 'POST', headers, body: JSON.stringify({ event: 'test', status: 'ok' }) });
    return json({ ok: res.ok, status: res.status });
  } catch (e) {
    return json({ error: String(e) }, { status: 500 });
  }
});