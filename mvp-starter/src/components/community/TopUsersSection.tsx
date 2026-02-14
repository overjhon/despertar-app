import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { Trophy, Flame, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TopUser {
  user_id: string;
  total_xp: number;
  current_level: number;
  current_streak_days: number;
  badge_count: number;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

export const TopUsersSection = () => {
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        // Fetch gamification data
        const { data: gamData, error: gamError } = await supabase
          .from('user_gamification')
          .select('user_id, total_xp, current_level, current_streak_days')
          .order('total_xp', { ascending: false })
          .limit(5);

        if (gamError) throw gamError;

        // Fetch profiles and badge counts for each user
        const usersWithDetails = await Promise.all(
          (gamData || []).map(async (user) => {
            // Fetch profile using public view
            const { data: profile } = await supabase
              .from('public_profiles')
              .select('full_name, avatar_url')
              .eq('id', user.user_id)
              .single();

            // Fetch badge count
            const { count } = await supabase
              .from('user_badges')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.user_id);

            return {
              ...user,
              badge_count: count || 0,
              profiles: profile || { full_name: 'Usuário', avatar_url: null },
            };
          })
        );

        setTopUsers(usersWithDetails);
      } catch (error) {
        console.error('Error fetching top users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopUsers();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">🏆 Top da Comunidade</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  const getAvatarBorderClass = (level: number) => {
    if (level >= 16) return 'ring-4 ring-gradient-to-r from-yellow-400 to-amber-500';
    if (level >= 11) return 'ring-4 ring-accent';
    if (level >= 6) return 'ring-4 ring-primary';
    return 'ring-2 ring-muted';
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        Top da Comunidade
      </h3>
      <div className="space-y-3">
        {topUsers.map((user, index) => (
          <Link
            key={user.user_id}
            to={`/user/${user.user_id}`}
            className="block group"
          >
            <Card className={cn(
              "p-4 hover:shadow-lg transition-all hover:scale-[1.02]",
              index === 0 && "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30"
            )}>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative">
                    <span className="absolute -top-2 -left-2 bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10">
                      {index + 1}
                    </span>
                    <Avatar className={cn("w-12 h-12", getAvatarBorderClass(user.current_level))}>
                      <AvatarImage src={user.profiles.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.profiles.full_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold group-hover:text-primary transition-colors truncate">
                      {user.profiles.full_name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {user.total_xp.toLocaleString()} XP
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {user.badge_count} badges
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        {user.current_streak_days} dias
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Card>
  );
};
