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

// Zod validation schemas
const createReferralSchema = z.object({
  action: z.literal('create'),
});

const convertReferralSchema = z.object({
  action: z.literal('convert'),
  referralCode: z.string().min(1, 'Código de indicação é obrigatório').max(50, 'Código muito longo').regex(/^[A-Z0-9]+$/, 'Código de indicação deve conter apenas letras maiúsculas e números'),
  email: z.string().email('Email inválido').max(255, 'Email muito longo').trim().toLowerCase(),
});

const referralSchema = z.discriminatedUnion('action', [
  createReferralSchema,
  convertReferralSchema,
]);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseLicenseClient = createClient(supabaseUrl, supabaseServiceKey);

    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    const licenseKey = req.headers.get('x-license-key') || '';
    const { data: isValid } = await supabaseLicenseClient.rpc('validate_license', { p_license_key: licenseKey, p_origin: origin });
    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Licença inválida', code: 'LICENSE_INVALID' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }
    // Parse and validate request body
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch (error) {
      console.error('[REFERRAL] Invalid JSON:', error);
      return new Response(
        JSON.stringify({ 
          error: 'JSON inválido',
          code: 'INVALID_JSON'
        }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const validation = referralSchema.safeParse(rawBody);
    if (!validation.success) {
      console.error('[REFERRAL] Validation failed:', validation.error.flatten());
      return new Response(
        JSON.stringify({ 
          error: 'Dados inválidos',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten().fieldErrors
        }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const validatedData = validation.data;
    const action = validatedData.action;
    const referralCode = 'referralCode' in validatedData ? validatedData.referralCode : undefined;
    const email = 'email' in validatedData ? validatedData.email : undefined;

    if (action === 'create') {
      // Criar novo código de indicação
      const authHeader = req.headers.get('Authorization')!;
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseLicenseClient.auth.getUser(token);

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      const { data: codeData } = await supabaseLicenseClient.rpc('generate_referral_code');
      
      const { data, error } = await supabaseLicenseClient
        .from('referrals')
        .insert({
          referrer_id: user.id,
          referral_code: codeData,
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 dias
        })
        .select()
        .single();

      if (error) {
        console.error('[REFERRAL] Database error creating referral:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Erro ao criar código de indicação',
            code: 'REFERRAL_CREATE_ERROR'
          }),
          { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ referral: data }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'convert') {
      // Marcar conversão de indicação
      const { data: referral } = await supabaseLicenseClient
        .from('referrals')
        .select('*')
        .eq('referral_code', referralCode)
        .eq('status', 'pending')
        .single();

      if (!referral) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired referral code' }),
          { status: 404, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      // Buscar usuário pelo email
      const { data: userData } = await supabaseLicenseClient
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (!userData) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      // Atualizar referral
      const { error: updateError } = await supabaseLicenseClient
        .from('referrals')
        .update({
          referred_user_id: userData.id,
          referred_email: email,
          status: 'converted',
          conversion_date: new Date().toISOString(),
          reward_type: 'xp',
        })
        .eq('id', referral.id);

      if (updateError) {
        console.error('[REFERRAL] Error updating conversion:', updateError);
        return new Response(
          JSON.stringify({ 
            error: 'Erro ao processar conversão',
            code: 'CONVERSION_ERROR'
          }),
          { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      // Dar XP para o referenciador (500 XP por indicação convertida)
      const { error: xpError } = await supabaseLicenseClient
        .from('xp_transactions')
        .insert({
          user_id: referral.referrer_id,
          xp_amount: 500,
          reason: 'Indicação bem-sucedida! 🎉',
          metadata: { referral_id: referral.id, referred_email: email }
        });

      if (xpError) {
        console.error('[REFERRAL] Error adding XP:', xpError);
      }

      // Atualizar gamification
      const { data: gamData } = await supabaseLicenseClient
        .from('user_gamification')
        .select('total_xp')
        .eq('user_id', referral.referrer_id)
        .single();

      if (gamData) {
        const newXP = gamData.total_xp + 500;
        await supabaseLicenseClient
          .from('user_gamification')
          .update({ total_xp: newXP })
          .eq('user_id', referral.referrer_id);
      }

      return new Response(
        JSON.stringify({ success: true, xpAwarded: 500 }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Log detailed error server-side only
    console.error('[REFERRAL] Internal error:', error);
    
    // Return generic error to client
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar indicação. Tente novamente.',
        code: 'REFERRAL_ERROR'
      }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
