import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    );

    const { action, referralCode, newUserId } = await req.json();

    if (action === 'check_conversion') {
      // Chamada quando alguém se cadastra com código de indicação
      // Atualizar referral com o novo usuário
      const { data: referral, error: referralError } = await supabaseClient
        .from('referrals')
        .update({
          referred_user_id: newUserId,
          status: 'converted',
          conversion_date: new Date().toISOString(),
        })
        .eq('referral_code', referralCode)
        .eq('status', 'pending')
        .select('referrer_id')
        .single();

      if (referralError || !referral) {
        console.error('Referral not found or already converted:', referralError);
        return new Response(JSON.stringify({ error: 'Referral not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Contar quantas indicações convertidas o indicador já tem
      const { data: conversions, error: countError } = await supabaseClient
        .from('referrals')
        .select('id', { count: 'exact' })
        .eq('referrer_id', referral.referrer_id)
        .eq('status', 'converted');

      if (countError) {
        console.error('Error counting conversions:', countError);
      }

      const totalConversions = conversions?.length || 0;

      // Dar XP por indicação convertida (500 XP)
      await supabaseClient.from('xp_transactions').insert({
        user_id: referral.referrer_id,
        xp_amount: 500,
        reason: 'Indicação convertida! 🎉',
        metadata: { referral_code: referralCode },
      });

      // Se atingiu 2 conversões, liberar recompensa (ebook grátis)
      if (totalConversions === 2) {
        // Criar notificação de recompensa disponível
        await supabaseClient.from('notifications').insert({
          user_id: referral.referrer_id,
          type: 'reward',
          title: '🎁 Você ganhou um ebook grátis!',
          message: 'Parabéns! Você indicou 2 amigas que se cadastraram. Escolha seu ebook gratuito agora!',
          link: '/library',
          metadata: { reward_type: 'free_ebook', conversions: 2 },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        conversions: totalConversions,
        reward_unlocked: totalConversions === 2,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Se action for 'claim_reward' (reivindicar ebook grátis)
    if (action === 'claim_reward') {
      const { ebookId } = await req.json();
      const authHeader = req.headers.get('Authorization');
      
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'No authorization header' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verificar se usuário tem 2+ conversões
      const { data: conversions } = await supabaseClient
        .from('referrals')
        .select('id')
        .eq('referrer_id', user.id)
        .eq('status', 'converted');

      if ((conversions?.length || 0) < 2) {
        return new Response(JSON.stringify({ error: 'Not enough conversions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Adicionar ebook à biblioteca do usuário
      await supabaseClient.from('user_ebooks').insert({
        user_id: user.id,
        ebook_id: ebookId,
      });

      // Marcar recompensa como reivindicada em um dos referrals
      await supabaseClient
        .from('referrals')
        .update({
          reward_type: 'free_ebook',
          reward_ebook_id: ebookId,
          reward_claimed_at: new Date().toISOString(),
        })
        .eq('referrer_id', user.id)
        .eq('status', 'converted')
        .is('reward_claimed_at', null)
        .limit(1);

      return new Response(JSON.stringify({
        success: true,
        message: 'Ebook adicionado à sua biblioteca!',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-referral-reward:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro ao processar recompensa. Tente novamente.',
      code: 'REWARD_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});