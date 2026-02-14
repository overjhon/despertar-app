import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Referral {
  id: string;
  referral_code: string;
  referred_email: string | null;
  status: string;
  conversion_date: string | null;
  reward_claimed: boolean;
  created_at: string;
}

export const useReferrals = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [myReferralCode, setMyReferralCode] = useState<string | null>(null);

  const fetchReferrals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReferrals(data || []);
      
      // Pegar o código ativo ou criar um novo
      const activeCode = data?.find(r => r.status === 'pending');
      if (activeCode) {
        setMyReferralCode(activeCode.referral_code);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReferralCode = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('process-referral', {
        body: { action: 'create' }
      });

      if (error) throw error;

      setMyReferralCode(data.referral.referral_code);
      toast({
        title: 'Código criado!',
        description: 'Compartilhe com suas amigas e ganhe recompensas!',
      });
      fetchReferrals();
    } catch (error) {
      console.error('Error creating referral code:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o código de indicação.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [user]);

  const stats = {
    total: referrals.length,
    converted: referrals.filter(r => r.status === 'converted').length,
    pending: referrals.filter(r => r.status === 'pending').length,
  };

  return {
    referrals,
    loading,
    myReferralCode,
    createReferralCode,
    refetch: fetchReferrals,
    stats,
  };
};
