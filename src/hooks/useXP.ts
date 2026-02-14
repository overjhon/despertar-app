import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface AddXPOptions {
  amount: number;
  reason: string;
  relatedEbookId?: string;
  metadata?: any;
  showToast?: boolean;
}

export const useXP = () => {
  const { user } = useAuth();

  const addXP = async (options: AddXPOptions) => {
    if (!user) return { success: false, levelUp: false };

    const { amount, reason, relatedEbookId, metadata, showToast = true } = options;

    try {
      // Fluxo não atômico (RPC add_xp_atomic ainda não implementado)
      const { data: currentData } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!currentData) {
        throw new Error('Gamification data not found');
      }

      const newXP = currentData.total_xp + amount;
      const oldLevel = currentData.current_level;
      const { data: levelData } = await supabase.rpc('calculate_level', { xp: newXP });
      const newLevel = levelData || 1;
      const levelUp = newLevel > oldLevel;

      await supabase
        .from('user_gamification')
        .update({ total_xp: newXP, current_level: newLevel })
        .eq('user_id', user.id);

      await supabase.from('xp_transactions').insert({
        user_id: user.id,
        xp_amount: amount,
        reason,
        related_ebook_id: relatedEbookId,
        metadata,
      });

      if (showToast) {
        toast({
          title: `+${amount} XP`,
          description: reason,
          duration: 2000,
        });
      }

      if (levelUp) {
        const { data: levelName } = await supabase.rpc('get_level_name', { level: newLevel });
        
        // Create level up notification
        await supabase.rpc('create_notification', {
          p_user_id: user.id,
          p_type: 'level_up',
          p_title: '🎉 Level Up!',
          p_message: `Você alcançou o nível ${newLevel}: ${levelName}`,
        });
        
        toast({
          title: '🎉 Level Up!',
          description: `Você alcançou o nível ${newLevel}: ${levelName}`,
          duration: 4000,
        });
      }

      return { success: true, levelUp, newLevel, newXP };
    } catch (error) {
      console.error('Error adding XP:', error);
      return { success: false, levelUp: false };
    }
  };

  return { addXP };
};
