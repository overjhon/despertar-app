import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  total_xp?: number;
  current_level?: number;
  current_streak_days?: number;
  total_pages_read?: number;
  total_reading_time_minutes?: number;
  books_completed?: number;
  best_daily_pages?: number;
  daily_pages?: number;
  weekly_xp?: number;
  monthly_xp?: number;
}

interface UserRankings {
  allTime: number;
  daily: number;
  weekly: number;
  monthly: number;
  pages: number;
  books: number;
  streaks: number;
  time: number;
}

interface ComparativeStats {
  userPages: number;
  avgPages: number;
  userXP: number;
  avgXP: number;
  userStreak: number;
  avgStreak: number;
  userBooks: number;
  avgBooks: number;
}

export const useLeaderboards = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allTimeLeaders, setAllTimeLeaders] = useState<LeaderboardUser[]>([]);
  const [dailyLeaders, setDailyLeaders] = useState<LeaderboardUser[]>([]);
  const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardUser[]>([]);
  const [monthlyLeaders, setMonthlyLeaders] = useState<LeaderboardUser[]>([]);
  const [pagesLeaders, setPagesLeaders] = useState<LeaderboardUser[]>([]);
  const [booksLeaders, setBooksLeaders] = useState<LeaderboardUser[]>([]);
  const [streaksLeaders, setStreaksLeaders] = useState<LeaderboardUser[]>([]);
  const [timeLeaders, setTimeLeaders] = useState<LeaderboardUser[]>([]);
  const [userRankings, setUserRankings] = useState<UserRankings | null>(null);
  const [comparativeStats, setComparativeStats] = useState<ComparativeStats | null>(null);

  const fetchAllTimeLeaderboard = async () => {
    const { data, error } = await supabase
      .from('user_gamification')
      .select(`
        user_id,
        total_xp,
        current_level,
        current_streak_days,
        total_pages_read,
        total_reading_time_minutes,
        books_completed,
        profiles!inner(id, full_name, avatar_url)
      `)
      .order('total_xp', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching all-time leaderboard:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.profiles.id,
      full_name: item.profiles.full_name,
      avatar_url: item.profiles.avatar_url,
      total_xp: item.total_xp,
      current_level: item.current_level,
      current_streak_days: item.current_streak_days,
      total_pages_read: item.total_pages_read,
      total_reading_time_minutes: item.total_reading_time_minutes,
      books_completed: item.books_completed,
    }));
  };

  const fetchDailyLeaderboard = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('daily_reading_stats')
      .select(`
        user_id,
        pages_read,
        xp_earned,
        profiles!inner(id, full_name, avatar_url)
      `)
      .eq('date', today)
      .order('pages_read', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching daily leaderboard:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.profiles.id,
      full_name: item.profiles.full_name,
      avatar_url: item.profiles.avatar_url,
      total_xp: 0,
      current_level: 0,
      current_streak_days: 0,
      daily_pages: item.pages_read,
    }));
  };

  const fetchWeeklyLeaderboard = async () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data, error } = await supabase
      .from('xp_transactions')
      .select(`
        user_id,
        xp_amount,
        profiles!inner(id, full_name, avatar_url)
      `)
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching weekly leaderboard:', error);
      return [];
    }

    // Agregar XP por usuário
    const userXPMap = new Map<string, any>();
    (data || []).forEach((item: any) => {
      const userId = item.profiles.id;
      if (!userXPMap.has(userId)) {
        userXPMap.set(userId, {
          id: userId,
          full_name: item.profiles.full_name,
          avatar_url: item.profiles.avatar_url,
          total_xp: 0,
          current_level: 0,
          current_streak_days: 0,
          weekly_xp: 0,
        });
      }
      userXPMap.get(userId)!.weekly_xp += item.xp_amount;
    });

    return Array.from(userXPMap.values())
      .sort((a, b) => b.weekly_xp - a.weekly_xp)
      .slice(0, 100);
  };

  const fetchMonthlyLeaderboard = async () => {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    const { data, error } = await supabase
      .from('xp_transactions')
      .select(`
        user_id,
        xp_amount,
        profiles!inner(id, full_name, avatar_url)
      `)
      .gte('created_at', monthAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching monthly leaderboard:', error);
      return [];
    }

    // Agregar XP por usuário
    const userXPMap = new Map<string, any>();
    (data || []).forEach((item: any) => {
      const userId = item.profiles.id;
      if (!userXPMap.has(userId)) {
        userXPMap.set(userId, {
          id: userId,
          full_name: item.profiles.full_name,
          avatar_url: item.profiles.avatar_url,
          total_xp: 0,
          current_level: 0,
          current_streak_days: 0,
          monthly_xp: 0,
        });
      }
      userXPMap.get(userId)!.monthly_xp += item.xp_amount;
    });

    return Array.from(userXPMap.values())
      .sort((a, b) => b.monthly_xp - a.monthly_xp)
      .slice(0, 100);
  };

  const fetchPagesLeaderboard = async () => {
    const { data, error } = await supabase
      .from('user_gamification')
      .select(`
        user_id,
        total_pages_read,
        current_level,
        profiles!inner(id, full_name, avatar_url)
      `)
      .order('total_pages_read', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching pages leaderboard:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.profiles.id,
      full_name: item.profiles.full_name,
      avatar_url: item.profiles.avatar_url,
      total_xp: 0,
      current_level: item.current_level,
      current_streak_days: 0,
      total_pages_read: item.total_pages_read,
    }));
  };

  const fetchBooksLeaderboard = async () => {
    const { data, error } = await supabase
      .from('user_gamification')
      .select(`
        user_id,
        books_completed,
        current_level,
        profiles!inner(id, full_name, avatar_url)
      `)
      .order('books_completed', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching books leaderboard:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.profiles.id,
      full_name: item.profiles.full_name,
      avatar_url: item.profiles.avatar_url,
      total_xp: 0,
      current_level: item.current_level,
      current_streak_days: 0,
      books_completed: item.books_completed,
    }));
  };

  const fetchStreaksLeaderboard = async () => {
    const { data, error } = await supabase
      .from('user_gamification')
      .select(`
        user_id,
        longest_streak_days,
        current_level,
        profiles!inner(id, full_name, avatar_url)
      `)
      .order('longest_streak_days', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching streaks leaderboard:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.profiles.id,
      full_name: item.profiles.full_name,
      avatar_url: item.profiles.avatar_url,
      total_xp: 0,
      current_level: item.current_level,
      current_streak_days: item.longest_streak_days,
    }));
  };

  const fetchTimeLeaderboard = async () => {
    const { data, error } = await supabase
      .from('user_gamification')
      .select(`
        user_id,
        total_reading_time_minutes,
        current_level,
        profiles!inner(id, full_name, avatar_url)
      `)
      .order('total_reading_time_minutes', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching time leaderboard:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.profiles.id,
      full_name: item.profiles.full_name,
      avatar_url: item.profiles.avatar_url,
      total_xp: 0,
      current_level: item.current_level,
      current_streak_days: 0,
      total_reading_time_minutes: item.total_reading_time_minutes,
    }));
  };

  const calculateUserRankings = async () => {
    if (!user) return null;

    const rankings: UserRankings = {
      allTime: 0,
      daily: 0,
      weekly: 0,
      monthly: 0,
      pages: 0,
      books: 0,
      streaks: 0,
      time: 0,
    };

    // Calcular posição no ranking geral
    const allTimeIndex = allTimeLeaders.findIndex(u => u.id === user.id);
    rankings.allTime = allTimeIndex >= 0 ? allTimeIndex + 1 : 0;

    // Calcular posição no ranking diário
    const dailyIndex = dailyLeaders.findIndex(u => u.id === user.id);
    rankings.daily = dailyIndex >= 0 ? dailyIndex + 1 : 0;

    // Calcular posição no ranking semanal
    const weeklyIndex = weeklyLeaders.findIndex(u => u.id === user.id);
    rankings.weekly = weeklyIndex >= 0 ? weeklyIndex + 1 : 0;

    // Calcular posição no ranking mensal
    const monthlyIndex = monthlyLeaders.findIndex(u => u.id === user.id);
    rankings.monthly = monthlyIndex >= 0 ? monthlyIndex + 1 : 0;

    // Calcular posição no ranking de páginas
    const pagesIndex = pagesLeaders.findIndex(u => u.id === user.id);
    rankings.pages = pagesIndex >= 0 ? pagesIndex + 1 : 0;

    // Calcular posição no ranking de livros
    const booksIndex = booksLeaders.findIndex(u => u.id === user.id);
    rankings.books = booksIndex >= 0 ? booksIndex + 1 : 0;

    // Calcular posição no ranking de streaks
    const streaksIndex = streaksLeaders.findIndex(u => u.id === user.id);
    rankings.streaks = streaksIndex >= 0 ? streaksIndex + 1 : 0;

    // Calcular posição no ranking de tempo
    const timeIndex = timeLeaders.findIndex(u => u.id === user.id);
    rankings.time = timeIndex >= 0 ? timeIndex + 1 : 0;

    return rankings;
  };

  const calculateComparativeStats = async () => {
    if (!user) return null;

    const today = new Date().toISOString().split('T')[0];
    
    // Buscar estatísticas do usuário hoje
    const { data: userDaily } = await supabase
      .from('daily_reading_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    const { data: userGam } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Calcular médias da plataforma
    const { data: avgDaily } = await supabase
      .from('daily_reading_stats')
      .select('pages_read')
      .eq('date', today);

    const { data: avgGam } = await supabase
      .from('user_gamification')
      .select('total_xp, current_streak_days, books_completed');

    const avgPages = avgDaily && avgDaily.length > 0 
      ? avgDaily.reduce((sum, d) => sum + d.pages_read, 0) / avgDaily.length 
      : 0;

    const avgXP = avgGam && avgGam.length > 0 
      ? avgGam.reduce((sum, g) => sum + g.total_xp, 0) / avgGam.length 
      : 0;

    const avgStreak = avgGam && avgGam.length > 0 
      ? avgGam.reduce((sum, g) => sum + g.current_streak_days, 0) / avgGam.length 
      : 0;

    const avgBooks = avgGam && avgGam.length > 0 
      ? avgGam.reduce((sum, g) => sum + g.books_completed, 0) / avgGam.length 
      : 0;

    return {
      userPages: userDaily?.pages_read || 0,
      avgPages: Math.round(avgPages),
      userXP: userGam?.total_xp || 0,
      avgXP: Math.round(avgXP),
      userStreak: userGam?.current_streak_days || 0,
      avgStreak: Math.round(avgStreak),
      userBooks: userGam?.books_completed || 0,
      avgBooks: Math.round(avgBooks),
    };
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [
        allTime,
        daily,
        weekly,
        monthly,
        pages,
        books,
        streaks,
        time,
      ] = await Promise.all([
        fetchAllTimeLeaderboard(),
        fetchDailyLeaderboard(),
        fetchWeeklyLeaderboard(),
        fetchMonthlyLeaderboard(),
        fetchPagesLeaderboard(),
        fetchBooksLeaderboard(),
        fetchStreaksLeaderboard(),
        fetchTimeLeaderboard(),
      ]);

      setAllTimeLeaders(allTime);
      setDailyLeaders(daily);
      setWeeklyLeaders(weekly);
      setMonthlyLeaders(monthly);
      setPagesLeaders(pages);
      setBooksLeaders(books);
      setStreaksLeaders(streaks);
      setTimeLeaders(time);

      // Calcular rankings do usuário e estatísticas comparativas
      if (user) {
        const rankings = await calculateUserRankings();
        const stats = await calculateComparativeStats();
        setUserRankings(rankings);
        setComparativeStats(stats);
      }
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [user]);

  return {
    loading,
    allTimeLeaders,
    dailyLeaders,
    weeklyLeaders,
    monthlyLeaders,
    pagesLeaders,
    booksLeaders,
    streaksLeaders,
    timeLeaders,
    userRankings,
    comparativeStats,
    refetch: fetchAll,
  };
};
