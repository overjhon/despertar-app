import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { z } from 'https://esm.sh/zod@3.22.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BADGE_IDS = {
  FIRST_EBOOK: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  THREE_EBOOKS: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  FOUR_EBOOKS: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
};

interface PendingPurchase {
  id: string;
  email: string;
  ebook_id: string | null;
  ebook_name: string;
  amount: number;
  transaction_id: string;
  paid_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[CLAIM] Authentication error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CLAIM] Processing claims for user:', user.id, user.email);

    // Get user's profile to retrieve email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    const userEmail = (profile?.email || user.email)?.toLowerCase().trim();

    if (!userEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch pending purchases for this user
    // Include both unclaimed AND claimed purchases that were never delivered
    const { data: pendingPurchases, error: fetchError } = await supabase
      .from('pending_purchases')
      .select('*')
      .eq('email', userEmail)
      .or('claimed.eq.false,and(claimed.eq.true,claimed_by.is.null)');

    if (fetchError) {
      console.error('[CLAIM] Error fetching pending purchases:', fetchError);
      throw new Error('Erro ao buscar compras pendentes');
    }

    if (!pendingPurchases || pendingPurchases.length === 0) {
      console.log('[CLAIM] No pending purchases found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          claimed_count: 0,
          message: 'Nenhuma compra pendente encontrada'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CLAIM] Found ${pendingPurchases.length} pending purchases`);

    let totalXP = 0;
    const badgesAwarded: string[] = [];
    const claimedEbooks: string[] = [];

    for (const purchase of pendingPurchases as PendingPurchase[]) {
      if (!purchase.ebook_id) {
        console.warn('[CLAIM] Skipping purchase without ebook_id:', purchase.id);
        continue;
      }

      console.log('[CLAIM] Processing purchase:', purchase.transaction_id, 'ebook_id:', purchase.ebook_id);

      // Check if ebook_id is actually a product_id and convert it using secure RPC
      let realEbookId = purchase.ebook_id;
      const { data: mappedEbookId, error: mappingError } = await supabase
        .rpc('get_ebook_id_for_product', { p_product_id: purchase.ebook_id });

      if (mappingError) {
        console.error('[CLAIM] Error fetching product mapping:', mappingError);
      } else if (mappedEbookId) {
        console.log('[CLAIM] Converting product_id to ebook_id:', purchase.ebook_id, '->', mappedEbookId);
        realEbookId = mappedEbookId;
      }

      // Validate ebook exists in database
      const { data: ebook, error: ebookCheckError } = await supabase
        .from('ebooks')
        .select('id, title')
        .eq('id', realEbookId)
        .maybeSingle();

      if (ebookCheckError || !ebook) {
        console.error('[CLAIM] Ebook not found in database:', {
          ebook_id: purchase.ebook_id,
          error: ebookCheckError,
        });
        continue;
      }

      console.log('[CLAIM] Ebook validated:', ebook.title);

      // Check if already purchased (use realEbookId)
      const { data: existingPurchase, error: checkError } = await supabase
        .from('user_ebooks')
        .select('id')
        .eq('user_id', user.id)
        .eq('ebook_id', realEbookId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('[CLAIM] Error checking existing purchase:', checkError);
      }

      if (existingPurchase) {
        console.log('[CLAIM] Ebook already purchased, skipping');
        continue;
      }

      // Add ebook to user's library (use realEbookId)
      console.log(`[CLAIM] Attempting to insert ebook ${realEbookId} for user ${user.id}`);
      const { data: insertedEbook, error: ebookError } = await supabase
        .from('user_ebooks')
        .insert({
          user_id: user.id,
          ebook_id: realEbookId,
          purchased_at: purchase.paid_at,
        })
        .select()
        .single();

      if (ebookError) {
        console.error('[CLAIM] Error adding ebook:', {
          code: ebookError.code,
          message: ebookError.message,
          details: ebookError.details,
          hint: ebookError.hint,
          ebook_id: purchase.ebook_id,
          user_id: user.id,
        });
        continue;
      }

      console.log('[CLAIM] Successfully inserted ebook:', insertedEbook);

      claimedEbooks.push(purchase.ebook_name);

      // Count total ebooks after this purchase
      const { count: totalEbooks } = await supabase
        .from('user_ebooks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Award XP
      const isFirstEbook = totalEbooks === 1;
      const xpAmount = isFirstEbook ? 500 : 200;
      totalXP += xpAmount;

      // Get current gamification data
      const { data: gamData } = await supabase
        .from('user_gamification')
        .select('total_xp, current_level')
        .eq('user_id', user.id)
        .single();

      if (gamData) {
        const newXP = gamData.total_xp + xpAmount;
        const { data: newLevel } = await supabase.rpc('calculate_level', { xp: newXP });

        await supabase
          .from('user_gamification')
          .update({
            total_xp: newXP,
            current_level: newLevel || gamData.current_level,
          })
          .eq('user_id', user.id);

        await supabase.from('xp_transactions').insert({
          user_id: user.id,
          xp_amount: xpAmount,
          reason: isFirstEbook ? 'Primeira compra de ebook' : 'Compra de ebook',
          related_ebook_id: realEbookId,
        });

        // Level up notification
        if (newLevel && newLevel > gamData.current_level) {
          const { data: levelName } = await supabase.rpc('get_level_name', { level: newLevel });
          await supabase.rpc('create_notification', {
            p_user_id: user.id,
            p_type: 'level_up',
            p_title: '🎉 Level Up!',
            p_message: `Você alcançou o nível ${newLevel}: ${levelName}`,
          });
        }
      }

      // Check and award badges
      const badgeChecks = [
        { count: 1, badgeId: BADGE_IDS.FIRST_EBOOK, xp: 100 },
        { count: 3, badgeId: BADGE_IDS.THREE_EBOOKS, xp: 300 },
        { count: 4, badgeId: BADGE_IDS.FOUR_EBOOKS, xp: 500 },
      ];

      for (const check of badgeChecks) {
        if (totalEbooks === check.count) {
          const { data: hasBadge } = await supabase
            .from('user_badges')
            .select('id')
            .eq('user_id', user.id)
            .eq('badge_id', check.badgeId)
            .single();

          if (!hasBadge) {
            await supabase.from('user_badges').insert({
              user_id: user.id,
              badge_id: check.badgeId,
            });

            await supabase.from('xp_transactions').insert({
              user_id: user.id,
              xp_amount: check.xp,
              reason: 'Badge conquistado',
            });

            totalXP += check.xp;
            badgesAwarded.push(check.badgeId);

            const { data: badge } = await supabase
              .from('badges')
              .select('name')
              .eq('id', check.badgeId)
              .single();

            await supabase.rpc('create_notification', {
              p_user_id: user.id,
              p_type: 'badge_earned',
              p_title: '🏆 Novo Badge!',
              p_message: `Você conquistou: ${badge?.name || 'Badge'}`,
            });
          }
        }
      }

      // Purchase notification
      await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_type: 'purchase',
        p_title: '📚 Compra Confirmada',
        p_message: `Ebook "${purchase.ebook_name}" adicionado à sua biblioteca!`,
        p_link: '/library',
      });

      // Mark as claimed
      await supabase
        .from('pending_purchases')
        .update({
          claimed: true,
          claimed_at: new Date().toISOString(),
          claimed_by: user.id,
        })
        .eq('id', purchase.id);
    }

    console.log('[CLAIM] Successfully claimed:', {
      count: claimedEbooks.length,
      totalXP,
      badges: badgesAwarded.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        claimed_count: claimedEbooks.length,
        ebooks: claimedEbooks,
        total_xp: totalXP,
        badges_awarded: badgesAwarded.length,
        message: `${claimedEbooks.length} ebook(s) resgatado(s) com sucesso!`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[CLAIM] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro ao resgatar compras. Tente novamente.',
        code: 'CLAIM_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
