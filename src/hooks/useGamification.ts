import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface GamificationData {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_read_date: string | null;
  pages_read_today: number;
  last_page_read_at: string | null;
}

export const useGamification = () => {
  const { user } = useAuth();
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGamification = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create initial gamification record
        const { data: newData, error: insertError } = await supabase
          .from('user_gamification')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        setGamificationData(newData);
      } else {
        setGamificationData(data);
      }
    } catch (error) {
      console.error('Error fetching gamification:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGamification();
  }, [user]);

  const refetch = () => {
    fetchGamification();
  };

  return { gamificationData, loading, refetch };
};
