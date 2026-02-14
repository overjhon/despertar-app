import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ReferralReward {
  conversions: number;
  rewardUnlocked: boolean;
  canClaimEbook: boolean;
}

export const useReferralRewards = () => {
  const { user } = useAuth();
  const [reward, setReward] = useState<ReferralReward>({
    conversions: 0,
    rewardUnlocked: false,
    canClaimEbook: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchRewardStatus = async () => {
    if (!user) return;

    try {
      // Buscar conversões
      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .eq('status', 'converted');

      const conversions = referrals?.length || 0;
      const rewardUnlocked = conversions >= 2;
      
      // Verificar se já reivindicou
      const hasClaimedReward = referrals?.some(r => r.reward_claimed_at !== null);
      
      setReward({
        conversions,
        rewardUnlocked,
        canClaimEbook: rewardUnlocked && !hasClaimedReward,
      });
    } catch (error) {
      console.error('Error fetching reward status:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimFreeEbook = async (ebookId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('process-referral-reward', {
        body: {
          action: 'claim_reward',
          ebookId,
        },
      });

      if (error) throw error;

      toast({
        title: '🎉 Ebook Desbloqueado!',
        description: 'O ebook foi adicionado à sua biblioteca!',
      });

      // Atualizar status
      fetchRewardStatus();
      
      return { success: true };
    } catch (error) {
      console.error('Error claiming ebook:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o ebook. Tente novamente.',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  useEffect(() => {
    fetchRewardStatus();
  }, [user]);

  return {
    reward,
    loading,
    claimFreeEbook,
    refetch: fetchRewardStatus,
  };
};