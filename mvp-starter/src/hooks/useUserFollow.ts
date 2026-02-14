import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useUserFollow = (targetUserId?: string) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (targetUserId) {
      checkFollowStatus();
      fetchFollowCounts();
    }
  }, [targetUserId, user]);

  const checkFollowStatus = async () => {
    if (!user || !targetUserId || user.id === targetUserId) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowCounts = async () => {
    if (!targetUserId) return;

    try {
      // Count followers
      const { count: followers } = await supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', targetUserId);

      // Count following
      const { count: following } = await supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', targetUserId);

      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);
    } catch (error) {
      console.error('Error fetching follow counts:', error);
    }
  };

  const toggleFollow = async () => {
    if (!user || !targetUserId) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para seguir usuários',
      });
      return;
    }

    if (user.id === targetUserId) {
      toast({
        title: 'Ação inválida',
        description: 'Você não pode seguir a si mesmo',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        
        toast({
          title: 'Deixou de seguir',
          description: 'Você não segue mais este usuário',
        });
      } else {
        // Follow
        await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });

        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        
        toast({
          title: 'Seguindo!',
          description: 'Você agora segue este usuário',
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível realizar esta ação',
        variant: 'destructive',
      });
    }
  };

  return {
    isFollowing,
    followersCount,
    followingCount,
    loading,
    toggleFollow,
  };
};
