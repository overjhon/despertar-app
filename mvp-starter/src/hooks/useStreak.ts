import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useStreak = () => {
  const { user } = useAuth();

  const updateStreak = async () => {
    if (!user) return;

    try {
      const { data: gamData } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!gamData) return;

      const today = new Date().toISOString().split('T')[0];
      const lastReadDate = gamData.last_read_date;

      let newStreakDays = gamData.current_streak_days;
      let longestStreak = gamData.longest_streak_days;

      if (!lastReadDate) {
        // First time reading
        newStreakDays = 1;
      } else {
        const lastDate = new Date(lastReadDate);
        const todayDate = new Date(today);
        const diffTime = todayDate.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          // Same day, don't update streak
          return;
        } else if (diffDays === 1) {
          // Consecutive day
          newStreakDays += 1;
        } else {
          // Streak broken
          newStreakDays = 1;
        }
      }

      if (newStreakDays > longestStreak) {
        longestStreak = newStreakDays;
      }

      await supabase
        .from('user_gamification')
        .update({
          current_streak_days: newStreakDays,
          longest_streak_days: longestStreak,
          last_read_date: today,
        })
        .eq('user_id', user.id);

      return { newStreakDays, longestStreak };
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  return { updateStreak };
};
