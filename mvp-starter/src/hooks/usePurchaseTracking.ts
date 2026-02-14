import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePurchaseTracking = () => {
  const { user } = useAuth();

  const trackClick = async (ebookId: string) => {
    if (!user) return;

    try {
      await supabase.from('purchase_clicks').insert({
        user_id: user.id,
        ebook_id: ebookId,
      });
    } catch (error) {
      console.error('Error tracking purchase click:', error);
    }
  };

  return { trackClick };
};
