import { supabase } from '@/integrations/supabase/client';

interface AdminEventMetadata {
  [key: string]: any;
}

export const logAdminEvent = async (
  eventName: string,
  metadata: AdminEventMetadata = {}
): Promise<void> => {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('Admin audit: no user available to log event', authError);
      return;
    }

    const { error } = await supabase.from('analytics_events').insert({
      event_name: eventName,
      user_id: user.id,
      metadata,
    });

    if (error) {
      console.warn('Admin audit insert failed:', error);
    }
  } catch (e) {
    console.warn('Admin audit unexpected error:', e);
  }
};