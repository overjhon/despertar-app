import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityStats {
  viewingCount: number;
  purchasedThisMonth: number;
  recentPurchases: Array<{
    location: string;
    created_at: string;
  }>;
  readingCount: number;
}

export const useLiveActivity = (ebookId: string) => {
  const [stats, setStats] = useState<ActivityStats>({
    viewingCount: 0,
    purchasedThisMonth: 0,
    recentPurchases: [],
    readingCount: 0,
  });

  const trackActivity = async (type: 'viewing' | 'purchased' | 'reading', location?: string) => {
    try {
      await supabase
        .from('live_activity')
        .insert({
          ebook_id: ebookId,
          activity_type: type,
          user_location: location,
        });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Get viewing count (last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: viewingCount } = await supabase
        .from('live_activity')
        .select('*', { count: 'exact', head: true })
        .eq('ebook_id', ebookId)
        .eq('activity_type', 'viewing')
        .gte('created_at', fiveMinutesAgo);

      // Get purchases this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: purchasedThisMonth } = await supabase
        .from('live_activity')
        .select('*', { count: 'exact', head: true })
        .eq('ebook_id', ebookId)
        .eq('activity_type', 'purchased')
        .gte('created_at', startOfMonth.toISOString());

      // Get recent purchases (last 2 hours)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data: recentPurchases } = await supabase
        .from('live_activity')
        .select('user_location, created_at')
        .eq('ebook_id', ebookId)
        .eq('activity_type', 'purchased')
        .gte('created_at', twoHoursAgo)
        .order('created_at', { ascending: false })
        .limit(3);

      // Get reading count (active in last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: readingCount } = await supabase
        .from('live_activity')
        .select('*', { count: 'exact', head: true })
        .eq('ebook_id', ebookId)
        .eq('activity_type', 'reading')
        .gte('created_at', oneHourAgo);

      setStats({
        viewingCount: viewingCount || 0,
        purchasedThisMonth: purchasedThisMonth || 0,
        recentPurchases: (recentPurchases || [])
          .filter(p => p.user_location)
          .map(p => ({ location: p.user_location!, created_at: p.created_at })),
        readingCount: readingCount || 0,
      });
    } catch (error) {
      console.error('Error fetching live stats:', error);
    }
  };

  useEffect(() => {
    if (ebookId) {
      trackActivity('viewing');
      fetchStats();

      // Refresh stats every 30 seconds
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [ebookId]);

  return {
    stats,
    trackActivity,
    refetch: fetchStats,
  };
};
