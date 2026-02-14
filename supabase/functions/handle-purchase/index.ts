import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { z } from 'https://esm.sh/zod@3.22.4';

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || req.headers.get('referer') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-timestamp, x-signature, x-license-key',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  };
}

// Badge IDs (hardcoded for performance)
const BADGE_IDS = {
  INVESTIDORA: '55553d71-fa25-4446-a621-d817c5560eb2', // 1º ebook
  COLECIONADORA: 'db55b35a-6650-4abc-bdf9-07976fe3489c', // 3 ebooks
  MESTRA_DAS_VELAS: 'fc3e1454-cd72-4d1a-a49a-02067e825bc0', // 4 ebooks (todos)
};

interface PurchasePayload {
  email: string;
  ebook_id: string;
  ebook_name: string;
  amount: number;
  transaction_id: string;
  paid_at: string;
  offer_id?: string;
  product_id?: string;
}

// Zod validation schema for purchase payload
const purchaseSchema = z.object({
  email: z.string().email('Email inválido').max(255, 'Email muito longo').trim().toLowerCase(),
  ebook_id: z.string().uuid('ID do ebook inválido').or(z.string().min(1, 'ID do produto é obrigatório').max(255)),
  ebook_name: z.string().min(1, 'Nome do ebook é obrigatório').max(500, 'Nome do ebook muito longo'),
  amount: z.number().positive('Valor deve ser positivo').max(100000, 'Valor muito alto'),
  transaction_id: z.string().min(1, 'ID da transação é obrigatório').max(255, 'ID da transação muito longo'),
  paid_at: z.string().datetime({ message: 'Data de pagamento inválida' }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Data de pagamento inválida')),
  offer_id: z.string().max(255, 'ID da oferta muito longo').optional(),
  product_id: z.string().max(255, 'ID do produto muito longo').optional(),
});

function calculateLevel(xp: number): number {
  if (xp < 500) return 1;
  if (xp < 1500) return 2;
  if (xp < 3500) return 3;
  if (xp < 7000) return 4;
  if (xp < 15000) return 5;
  if (xp < 30000) return 6;
  return 7;
}

function getLevelName(level: number): string {
  const names = ['Aprendiz', 'Leitor', 'Entusiasta', 'Conhecedor', 'Expert', 'Mestre', 'Lenda'];
  return names[level - 1] || 'Desconhecido';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ============= VALIDAÇÃO DE LICENÇA =============
    const licenseKey = req.headers.get('X-License-Key');
    const origin = req.headers.get('Origin') || req.headers.get('Referer') || '';

    if (!licenseKey) {
      console.error('[LICENSE] Missing X-License-Key header');
      return new Response(
        JSON.stringify({ success: false, error: 'License key required', code: 'NO_LICENSE' }),
        { status: 403, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Validar licença via RPC
    const { data: isValid, error: licenseError } = await supabase.rpc('validate_license', {
      p_license_key: licenseKey,
      p_origin: origin,
    });

    if (licenseError || !isValid) {
      console.error('[LICENSE] Invalid license', { licenseKey, origin, error: licenseError });
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired license', code: 'INVALID_LICENSE' }),
        { status: 403, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('[LICENSE] Valid license for origin:', origin);
    // ============= FIM VALIDAÇÃO DE LICENÇA =============

    // Parse and validate payload
    const rawBody = await req.text();
    let rawPayload: unknown;
    try {
      rawPayload = JSON.parse(rawBody);
    } catch (error) {
      console.error('[PURCHASE] Invalid JSON:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'JSON inválido',
          code: 'INVALID_JSON'
        }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }
    
    // Rate limiting para prevenir abuse
    const rateLimitKey = `webhook:${req.headers.get('x-forwarded-for') || 'unknown'}`;
    const { data: rateLimit } = await supabase.rpc('check_rate_limit', {
      p_identifier: rateLimitKey,
      p_action: 'webhook_purchase',
      p_max_attempts: 20,
      p_window_minutes: 1,
      p_block_minutes: 5
    });

    if (rateLimit && !rateLimit.allowed) {
      console.error('⛔ Rate limit exceeded for webhook');
      return new Response(
        JSON.stringify({ 
          error: 'Muitas tentativas. Tente novamente mais tarde.',
          code: 'RATE_LIMIT_EXCEEDED'
        }), 
        { status: 429, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const validation = purchaseSchema.safeParse(rawPayload);
    if (!validation.success) {
      console.error('[PURCHASE] Validation failed:', validation.error.flatten());
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Dados inválidos',
          code: 'VALIDATION_ERROR'
        }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const payload: PurchasePayload = validation.data;
    
    // Log webhook attempt for audit trail
    console.log('[PURCHASE] Valid webhook received:', {
      email: payload.email,
      ebook_id: payload.ebook_id,
      transaction_id: payload.transaction_id,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      timestamp: new Date().toISOString()
    });

    // All required fields are now validated by Zod schema
    if (false) {
      throw new Error('Missing required fields: email, ebook_id, or transaction_id');
    }

    // Sanitize email
    const email = payload.email.trim().toLowerCase();

    // 1. Map product_id to real ebook_id using secure function
    const productId = payload.ebook_id; // This is the payment system's product_id
    console.log('[PURCHASE] Looking up product mapping for:', productId);
    
    const { data: realEbookId, error: mappingError } = await supabase
      .rpc('get_ebook_id_for_product', { p_product_id: productId });

    if (mappingError) {
      console.error('[PURCHASE] Error fetching product mapping:', mappingError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao processar compra',
          code: 'PRODUCT_LOOKUP_ERROR'
        }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (!realEbookId) {
      console.error('[PURCHASE] Product not mapped:', productId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Produto não encontrado',
          code: 'PRODUCT_NOT_FOUND'
        }),
        { status: 404, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('[PURCHASE] Mapped to ebook:', realEbookId);

    // 2. Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    console.log('[PURCHASE] Searching for user:', normalizedEmail);
    
    const { data: userId, error: rpcError } = await supabase.rpc('get_user_id_by_email', {
      user_email: normalizedEmail
    });
    
    if (rpcError) {
      console.error('[PURCHASE] Error calling RPC:', rpcError);
      throw new Error('Erro ao buscar usuário');
    }
    
    // If user not found, save as pending purchase
    if (!userId) {
      console.log('[PURCHASE] User not found, saving as pending:', normalizedEmail);
      
      const { error: pendingError } = await supabase
        .from('pending_purchases')
        .upsert({
          email: normalizedEmail,
          offer_id: payload.offer_id,
          product_id: payload.product_id,
          ebook_id: realEbookId, // Use mapped ebook_id
          ebook_name: payload.ebook_name,
          amount: payload.amount,
          transaction_id: payload.transaction_id,
          paid_at: payload.paid_at,
          raw_payload: payload,
        }, {
          onConflict: 'transaction_id'
        });
      
      if (pendingError) {
        console.error('[PURCHASE] Error saving pending purchase:', pendingError);
        throw new Error('Erro ao salvar compra pendente');
      }
      
      console.log('[PURCHASE] Pending purchase saved successfully');
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'pending_user',
          message: 'Compra salva. Complete o cadastro para acessar seu ebook.'
        }),
        { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('[PURCHASE] User found:', { user_id: userId, email: normalizedEmail });

    // 3. Check if ebook was already purchased
    const { data: existingPurchase } = await supabase
      .from('user_ebooks')
      .select('id')
      .eq('user_id', userId)
      .eq('ebook_id', realEbookId)
      .maybeSingle();

    if (existingPurchase) {
      console.log('[PURCHASE] Ebook already purchased:', { user_id: userId, ebook_id: realEbookId });
      return new Response(
        JSON.stringify({ success: false, error: 'Ebook já foi adquirido anteriormente' }),
        { status: 409, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // 4. Insert into user_ebooks
    const { error: insertError } = await supabase
      .from('user_ebooks')
      .insert({
        user_id: userId,
        ebook_id: realEbookId,
        purchased_at: payload.paid_at,
      });

    if (insertError) {
      console.error('[PURCHASE] Error inserting user_ebook:', insertError);
      throw insertError;
    }

    console.log('[PURCHASE] Ebook added to user_ebooks');

    // 4. Count total ebooks purchased by user
    const { count: totalEbooks } = await supabase
      .from('user_ebooks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const isFirstPurchase = totalEbooks === 1;
    console.log('[PURCHASE] Total ebooks:', { total: totalEbooks, is_first: isFirstPurchase });

    // 6. Calculate XP to award
    const purchaseXP = isFirstPurchase ? 500 : 200;

    // 7. Get current gamification data
    let { data: gamData, error: gamError } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Create gamification record if doesn't exist
    if (!gamData) {
      const { data: newGamData, error: createError } = await supabase
        .from('user_gamification')
        .insert({ user_id: userId })
        .select()
        .single();

      if (createError) throw createError;
      gamData = newGamData;
    }

    const oldLevel = gamData.current_level;
    const newTotalXP = gamData.total_xp + purchaseXP;
    const newLevel = calculateLevel(newTotalXP);
    const levelUp = newLevel > oldLevel;

    // 8. Update user_gamification
    const { error: updateGamError } = await supabase
      .from('user_gamification')
      .update({
        total_xp: newTotalXP,
        current_level: newLevel,
      })
      .eq('user_id', userId);

    if (updateGamError) throw updateGamError;

    console.log('[PURCHASE] XP awarded:', { 
      xp_amount: purchaseXP, 
      new_total: newTotalXP,
      old_level: oldLevel,
      new_level: newLevel,
      level_up: levelUp
    });

    // 9. Create XP transaction record
    await supabase.from('xp_transactions').insert({
      user_id: userId,
      xp_amount: purchaseXP,
      reason: `Compra do ebook "${payload.ebook_name}"`,
      related_ebook_id: realEbookId,
      metadata: {
        transaction_id: payload.transaction_id,
        amount: payload.amount,
        ebook_name: payload.ebook_name,
        is_first_purchase: isFirstPurchase,
        product_id: productId,
      },
    });

    // 10. Badge system
    const badgesAwarded: string[] = [];
    let totalBadgeXP = 0;

    // Check and award badges based on total ebooks
    const badgeRules = [
      { count: 1, id: BADGE_IDS.INVESTIDORA, name: 'Investidora', xp: 100 },
      { count: 3, id: BADGE_IDS.COLECIONADORA, name: 'Colecionadora', xp: 300 },
      { count: 4, id: BADGE_IDS.MESTRA_DAS_VELAS, name: 'Mestra das Velas', xp: 500 },
    ];

    for (const rule of badgeRules) {
      if (totalEbooks === rule.count) {
        // Check if badge already earned
        const { data: existingBadge } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', userId)
          .eq('badge_id', rule.id)
          .maybeSingle();

        if (!existingBadge) {
          // Award badge
          await supabase.from('user_badges').insert({
            user_id: userId,
            badge_id: rule.id,
          });

          badgesAwarded.push(rule.name);
          totalBadgeXP += rule.xp;

          // Update XP with badge reward
          const newTotalWithBadge = newTotalXP + rule.xp;
          const levelWithBadge = calculateLevel(newTotalWithBadge);

          await supabase
            .from('user_gamification')
            .update({ 
              total_xp: newTotalWithBadge,
              current_level: levelWithBadge,
            })
            .eq('user_id', userId);

          // Create XP transaction for badge
          await supabase.from('xp_transactions').insert({
            user_id: userId,
            xp_amount: rule.xp,
            reason: `Badge conquistado: ${rule.name}`,
            metadata: { badge_id: rule.id, badge_name: rule.name },
          });

          // Create badge notification
          await supabase.rpc('create_notification', {
            p_user_id: userId,
            p_type: 'badge_earned',
            p_title: '🏆 Nova Conquista!',
            p_message: `Você ganhou o badge "${rule.name}"! (+${rule.xp} XP)`,
            p_link: '/profile',
          });

          console.log('[PURCHASE] Badge awarded:', { badge: rule.name, xp: rule.xp });
        }
      }
    }

    // 11. Create purchase notification
    await supabase.rpc('create_notification', {
      p_user_id: userId,
      p_type: 'purchase',
      p_title: '🎉 Compra Confirmada!',
      p_message: `Seu ebook "${payload.ebook_name}" já está disponível!`,
      p_link: `/ebook/${realEbookId}`,
    });

    // 12. Create level up notification if applicable
    if (levelUp) {
      const levelName = getLevelName(newLevel);
      await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_type: 'level_up',
        p_title: '⚡ Level Up!',
        p_message: `Você alcançou o nível ${newLevel}: ${levelName}!`,
        p_link: '/profile',
      });
    }

    console.log('[PURCHASE] Success:', {
      user_id: userId,
      product_id: productId,
      ebook_id: realEbookId,
      total_ebooks: totalEbooks,
      xp_awarded: purchaseXP + totalBadgeXP,
      badges_awarded: badgesAwarded,
      level_up: levelUp,
      new_level: newLevel,
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Ebook liberado com sucesso',
        data: {
          user_id: userId,
          ebook_id: realEbookId,
          xp_awarded: purchaseXP + totalBadgeXP,
          badges_awarded: badgesAwarded,
          level_up: levelUp,
          new_level: levelUp ? newLevel : undefined,
          total_ebooks: totalEbooks,
        },
      }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Log detailed error server-side only
    console.error('[PURCHASE] Internal error:', error);
    
    // Return generic error to client
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro ao processar compra. Tente novamente.',
        code: 'PURCHASE_ERROR'
      }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
