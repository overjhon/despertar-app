import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.22.4';

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || req.headers.get('referer') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-timestamp, x-signature, x-license-key',
  };
}

// Zod validation schema for content moderation
const moderationSchema = z.object({
  contentType: z.enum(['post', 'comment', 'testimonial', 'creation'], {
    errorMap: () => ({ message: 'Tipo de conteúdo inválido' })
  }),
  contentId: z.string().uuid('ID do conteúdo inválido'),
  content: z.string().min(1, 'Conteúdo não pode estar vazio').max(10000, 'Conteúdo muito longo (máximo 10.000 caracteres)'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authorization header' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth token for verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Invalid token:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Moderation request from user: ${user.id}`);

    // Parse and validate request body
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch (error) {
      console.error('[MODERATE] Invalid JSON:', error);
      return new Response(
        JSON.stringify({ error: 'JSON inválido' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const validation = moderationSchema.safeParse(rawBody);
    if (!validation.success) {
      console.error('[MODERATE] Validation failed:', validation.error.flatten());
      return new Response(
        JSON.stringify({ 
          error: 'Dados de moderação inválidos',
          code: 'INVALID_MODERATION_DATA'
        }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const { contentType, contentId, content } = validation.data;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Análise com Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um moderador de conteúdo. Analise o texto e retorne um JSON com:
{
  "score": 0.0-1.0 (0=inapropriado, 1=apropriado),
  "flags": ["spam", "hate_speech", "inappropriate", "violence", "sexual_content"],
  "analysis": "breve explicação",
  "recommendation": "approve" ou "reject" ou "review"
}
Seja rigoroso mas justo. Conteúdo sobre velas artesanais é o tema principal.`
          },
          { role: 'user', content: content }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Log error server-side only (without exposing to client)
      console.error('[MODERATE] AI API error:', { status: response.status, error: errorText });
      return new Response(
        JSON.stringify({ 
          error: 'Não foi possível analisar o conteúdo. Tente novamente.',
          code: 'AI_ANALYSIS_FAILED'
        }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const aiResult = JSON.parse(aiData.choices[0].message.content);

    // Salvar resultado no Supabase usando service role para bypass RLS
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const moderationRecord = {
      content_type: contentType,
      content_id: contentId,
      ai_score: aiResult.score,
      flags: aiResult.flags || [],
      ai_analysis: aiResult.analysis,
      status: aiResult.score >= 0.7 ? 'auto_approved' : 'pending',
    };

    const { data, error } = await supabase
      .from('content_moderation')
      .insert(moderationRecord)
      .select()
      .single();

    if (error) {
      console.error('[MODERATE] Database error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao salvar resultado da moderação',
          code: 'DB_SAVE_ERROR'
        }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        moderation: data,
        shouldApprove: aiResult.score >= 0.7,
        recommendation: aiResult.recommendation
      }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Log detailed error server-side only
    console.error('[MODERATE] Internal error:', error);
    
    // Return generic error to client
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar moderação. Tente novamente.',
        code: 'MODERATION_ERROR'
      }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
