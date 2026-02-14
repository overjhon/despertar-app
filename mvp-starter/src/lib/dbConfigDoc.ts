interface ConnectionDocDetails {
  error?: any;
  context?: any;
}

export function logSupabaseConnectionDoc(eventName: string, details?: ConnectionDocDetails) {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const hasAnon = Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

  const doc = {
    event: eventName,
    timestamp: new Date().toISOString(),
    env: {
      supabase_url_present: Boolean(url),
      supabase_anon_present: hasAnon,
    },
    postgrest_endpoint: url ? `${url}/rest/v1` : null,
    rls_notes:
      'RLS ativo. Admins possuem acesso amplo via user_roles. Usuários autenticados veem apenas seus próprios dados/ebooks ativos.',
    common_errors: [
      '23503: violação de chave estrangeira (ex.: product_mappings -> ebooks).',
      'PGRST116: nada a deletar/atualizar (id inexistente).',
    ],
    context: details?.context ?? null,
    error: details?.error ? String(details.error?.message ?? details.error) : undefined,
  };

  // Apenas log local para diagnóstico; não enviamos dados sensíveis.
  console.info('🔎 SUPABASE_CONNECTION_DOC', doc);
}