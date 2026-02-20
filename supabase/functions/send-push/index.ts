import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface PayloadFilters {
  role: 'any' | 'admin' | 'user' | 'moderator';
  minLevel: number;
  maxLevel: number;
  streakMin: number;
}

interface PushPayload {
  title: string;
  message: string;
  link?: string;
  type?: string;
  filters: PayloadFilters;
  dryRun?: boolean;
}

const json = (data: any, init: ResponseInit = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
});

// Minimal Supabase client (Edge) via fetch
const SUPABASE_URL = Deno.env.get('URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

async function supabaseQuery(path: string, method: string, body?: any) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

async function resolveAudience(filters: PayloadFilters): Promise<string[]> {
  const { role, minLevel, maxLevel, streakMin } = filters;
  const res = await supabaseQuery(
    `user_gamification?select=user_id,current_level,current_streak_days&current_level=gte.${minLevel}&current_level=lte.${maxLevel}&current_streak_days=gte.${streakMin}`,
    'GET'
  );
  const list = await res.json();
  let ids: string[] = (list || []).map((x: any) => x.user_id);
  if (role !== 'any') {
    const resRole = await supabaseQuery(`user_roles?select=user_id&role=eq.${role}`, 'GET');
    const roleUsers = await resRole.json();
    const roleSet = new Set(roleUsers.map((r: any) => r.user_id));
    ids = ids.filter(id => roleSet.has(id));
  }
  return ids;
}

async function logDelivery(userId: string, status: string, error?: string, messageId?: string) {
  await supabaseQuery('push_delivery_logs', 'POST', {
    user_id: userId,
    status,
    error,
    message_id: messageId || null,
  });
}

// TODO: Implement FCM v1 OAuth; for now, only dry-run unless env set and not dryRun
async function sendFCM(toToken: string, payload: { title: string; message: string; link?: string }) {
  // Placeholder: integrate FCM HTTP v1 here using service account
  // Return fake messageId for now
  return { ok: true, messageId: `dry-${crypto.randomUUID()}` };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });
    const body = await req.json() as PushPayload;
    const { title, message, link, type = 'announcement', filters, dryRun = true } = body;
    if (!title || !message || !filters) return json({ error: 'Invalid payload' }, { status: 400 });

    const audience = await resolveAudience(filters);

    if (dryRun) {
      for (const id of audience) await logDelivery(id, 'dry_run');
      return json({ ok: true, dryRun: true, audienceCount: audience.length });
    }

    // Resolve tokens
    const resTokens = await supabaseQuery('push_subscriptions?select=user_id,provider,subscription,fcm_token,enabled', 'GET');
    const tokens = await resTokens.json();
    const tokenByUser = new Map<string, string>();
    for (const row of tokens) {
      if (row.enabled !== false && row.fcm_token) tokenByUser.set(row.user_id, row.fcm_token);
    }

    let success = 0, failed = 0;
    for (const userId of audience) {
      const tok = tokenByUser.get(userId);
      if (!tok) {
        await logDelivery(userId, 'no_token');
        failed++;
        continue;
      }
      const res = await sendFCM(tok, { title, message, link });
      if (res.ok) {
        await logDelivery(userId, 'sent', undefined, res.messageId);
        // Criar histórico em notifications
        await supabaseQuery('rpc/create_notification', 'POST', {
          p_user_id: userId,
          p_type: type,
          p_title: title,
          p_message: message,
          p_link: link || null,
        });
        success++;
      } else {
        await logDelivery(userId, 'failed', 'send_error');
        failed++;
      }
    }

    return json({ ok: true, success, failed, audienceCount: audience.length });
  } catch (e) {
    return json({ error: String(e) }, { status: 500 });
  }
});