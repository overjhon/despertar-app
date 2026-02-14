import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserGamificationData {
  user_id: string;
  total_xp: number;
  current_level: number;
  current_streak_days: number;
  longest_streak_days: number;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badges: {
    name: string;
    icon: string;
    category: string;
  };
}

export const useUserGamification = (userId: string | null) => {
  const [gamificationData, setGamificationData] = useState<UserGamificationData | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch gamification data
        const { data: gamData, error: gamError } = await supabase
          .from('user_gamification')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (gamError) throw gamError;
        setGamificationData(gamData);

        // Fetch user badges (top 3 most recent)
        const { data: badgesData, error: badgesError } = await supabase
          .from('user_badges')
          .select(`
            id,
            badge_id,
            earned_at,
            badges (
              name,
              icon,
              category
            )
          `)
          .eq('user_id', userId)
          .order('earned_at', { ascending: false })
          .limit(3);

        if (badgesError) throw badgesError;
        setBadges(badgesData || []);
      } catch (error) {
        console.error('Error fetching user gamification data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  return { gamificationData, badges, loading };
};
