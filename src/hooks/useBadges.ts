import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  criteria: any;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badges: Badge;
}

export const useBadges = () => {
  const { user } = useAuth();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBadges = async () => {
    try {
      // Fetch all badges
      const { data: badges } = await supabase
        .from('badges')
        .select('*')
        .order('created_at');

      if (badges) setAllBadges(badges);

      if (user) {
        // Fetch user's earned badges
        const { data: earned } = await supabase
          .from('user_badges')
          .select('*, badges(*)')
          .eq('user_id', user.id);

        if (earned) setUserBadges(earned);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, [user]);

  const awardBadge = async (badgeId: string) => {
    if (!user) return false;

    try {
      // Check if user already has this badge
      const existing = userBadges.find(ub => ub.badge_id === badgeId);
      if (existing) return false;

      // Award badge
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: user.id,
          badge_id: badgeId,
        });

      if (error) throw error;

      // Get badge details
      const badge = allBadges.find(b => b.id === badgeId);
      if (badge) {
        // Create badge earned notification
        await supabase.rpc('create_notification', {
          p_user_id: user.id,
          p_type: 'badge_earned',
          p_title: '🏆 Nova Conquista!',
          p_message: `${badge.icon} ${badge.name}: ${badge.description}`,
        });
        
        toast({
          title: `🏆 Nova Conquista!`,
          description: `${badge.icon} ${badge.name}: ${badge.description}`,
          duration: 5000,
        });

        // Award XP if badge has XP reward
        if (badge.xp_reward > 0) {
          // The XP addition will be handled by useXP hook
        }
      }

      await fetchBadges();
      return true;
    } catch (error) {
      console.error('Error awarding badge:', error);
      return false;
    }
  };

  const hasBadge = (badgeId: string) => {
    return userBadges.some(ub => ub.badge_id === badgeId);
  };

  const getBadgeProgress = () => {
    return {
      earned: userBadges.length,
      total: allBadges.length,
      percentage: allBadges.length > 0 ? (userBadges.length / allBadges.length) * 100 : 0,
    };
  };

  return {
    allBadges,
    userBadges,
    loading,
    awardBadge,
    hasBadge,
    getBadgeProgress,
    refetch: fetchBadges,
  };
};
