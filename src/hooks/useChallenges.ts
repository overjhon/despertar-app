import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: string;
  goal_type: string;
  goal_value: number;
  xp_reward: number;
  start_date: string;
  end_date: string;
}

interface UserChallenge {
  id: string;
  challenge_id: string;
  current_progress: number;
  completed: boolean;
  completed_at: string | null;
  claimed: boolean;
  claimed_at: string | null;
  challenges: Challenge;
}

export const useChallenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = async () => {
    if (!user) return;

    try {
      // Get active challenges
      const { data: activeChallenges } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString());

      if (!activeChallenges) return;

      // Get user progress for these challenges
      const { data: userChallengesData } = await supabase
        .from('user_challenges')
        .select('*, challenges(*)')
        .eq('user_id', user.id)
        .in('challenge_id', activeChallenges.map(c => c.id));

      // Create user challenge records for new challenges
      const existingChallengeIds = userChallengesData?.map(uc => uc.challenge_id) || [];
      const newChallenges = activeChallenges.filter(c => !existingChallengeIds.includes(c.id));

      if (newChallenges.length > 0) {
        const { data: created } = await supabase
          .from('user_challenges')
          .insert(
            newChallenges.map(c => ({
              user_id: user.id,
              challenge_id: c.id,
            }))
          )
          .select('*, challenges(*)');

        if (created) {
          setChallenges([...(userChallengesData || []), ...created] as any);
        }
      } else {
        setChallenges((userChallengesData || []) as any);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [user]);

  const updateChallengeProgress = async (goalType: string, value: number) => {
    if (!user) return;

    try {
      // Find challenges matching this goal type
      const relevantChallenges = challenges.filter(
        uc => uc.challenges.goal_type === goalType && !uc.completed
      );

      for (const userChallenge of relevantChallenges) {
        const newProgress = Math.min(userChallenge.current_progress + value, userChallenge.challenges.goal_value);
        const isCompleted = newProgress >= userChallenge.challenges.goal_value;

        await supabase
          .from('user_challenges')
          .update({
            current_progress: newProgress,
            completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
          })
          .eq('id', userChallenge.id);

        if (isCompleted && !userChallenge.completed) {
          // Create notification
          await supabase.rpc('create_notification', {
            p_user_id: user.id,
            p_type: 'challenge_completed',
            p_title: '🎯 Desafio Completado!',
            p_message: `Você completou: ${userChallenge.challenges.name}`,
            p_link: '/challenges',
          });

          toast({
            title: '🎯 Desafio Completado!',
            description: `${userChallenge.challenges.name} - Reivindique sua recompensa!`,
            duration: 5000,
          });
        }
      }

      await fetchChallenges();
    } catch (error) {
      console.error('Error updating challenge progress:', error);
    }
  };

  const claimReward = async (userChallengeId: string) => {
    if (!user) return { success: false };

    try {
      const userChallenge = challenges.find(uc => uc.id === userChallengeId);
      if (!userChallenge || !userChallenge.completed || userChallenge.claimed) {
        return { success: false };
      }

      // Mark as claimed
      await supabase
        .from('user_challenges')
        .update({
          claimed: true,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', userChallengeId);

      toast({
        title: '✅ Recompensa Reivindicada!',
        description: `+${userChallenge.challenges.xp_reward} XP`,
        duration: 3000,
      });

      await fetchChallenges();
      return { success: true, xpReward: userChallenge.challenges.xp_reward };
    } catch (error) {
      console.error('Error claiming reward:', error);
      return { success: false };
    }
  };

  return {
    challenges,
    loading,
    updateChallengeProgress,
    claimReward,
    refetch: fetchChallenges,
  };
};
