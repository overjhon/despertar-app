import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, BookOpen, Trophy, Users, UserPlus, UserMinus } from 'lucide-react';
import { useUserFollow } from '@/hooks/useUserFollow';
import { XPBar } from '@/components/gamification/XPBar';
import { BadgeCard } from '@/components/gamification/BadgeCard';
import { StreakIndicator } from '@/components/gamification/StreakIndicator';

interface PublicProfileData {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

interface GamificationData {
  total_xp: number;
  current_level: number;
  current_streak_days: number;
  longest_streak_days: number;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badges: {
    name: string;
    description: string;
    icon: string;
    category: string;
  };
}

const PublicProfile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [stats, setStats] = useState({ totalEbooks: 0, completedEbooks: 0 });
  const [loading, setLoading] = useState(true);

  const { isFollowing, followersCount, followingCount, toggleFollow } = useUserFollow(userId);

  useEffect(() => {
    if (!userId) {
      navigate('/community');
      return;
    }
    fetchPublicProfile();
  }, [userId, navigate]);

  const fetchPublicProfile = async () => {
    if (!userId) return;

    try {
      // Fetch profile using public view (no sensitive data)
      const { data: profileData } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) setProfile(profileData);

      // Fetch gamification data
      const { data: gamData } = await supabase
        .from('user_gamification')
        .select('total_xp, current_level, current_streak_days, longest_streak_days')
        .eq('user_id', userId)
        .single();

      if (gamData) setGamification(gamData);

      // Fetch badges
      const { data: badgesData } = await supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', userId);

      if (badgesData) setBadges(badgesData as any);

      // Fetch stats
      const { data: ebooksData } = await supabase
        .from('user_ebooks')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      const { data: completedData } = await supabase
        .from('user_progress')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('completed', true);

      setStats({
        totalEbooks: ebooksData?.length || 0,
        completedEbooks: completedData?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching public profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOwnProfile = currentUser?.id === userId;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Users className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Perfil não encontrado</h2>
          <Link to="/community">
            <Button>Voltar à Comunidade</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/community">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Perfil Público</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold mb-2">{profile.full_name}</h2>
                <p className="text-muted-foreground mb-4">
                  Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                </p>
                <div className="flex gap-4 justify-center md:justify-start text-sm">
                  <div>
                    <span className="font-bold">{followersCount}</span>
                    <span className="text-muted-foreground ml-1">Seguidores</span>
                  </div>
                  <div>
                    <span className="font-bold">{followingCount}</span>
                    <span className="text-muted-foreground ml-1">Seguindo</span>
                  </div>
                </div>
              </div>
              {!isOwnProfile && currentUser && (
                <Button
                  onClick={toggleFollow}
                  variant={isFollowing ? 'outline' : 'default'}
                  className="gap-2"
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      Deixar de Seguir
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Seguir
                    </>
                  )}
                </Button>
              )}
              {isOwnProfile && (
                <Link to="/profile">
                  <Button variant="outline">Ver Perfil Completo</Button>
                </Link>
              )}
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalEbooks}</p>
                  <p className="text-sm text-muted-foreground">Ebooks</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-500/10 rounded-full p-3">
                  <Trophy className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completedEbooks}</p>
                  <p className="text-sm text-muted-foreground">Completados</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Gamification */}
          {gamification && (
            <>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Progresso
                </h3>
                <XPBar
                  currentXP={gamification.total_xp}
                  currentLevel={gamification.current_level}
                />
              </Card>

              <div>
                <h3 className="text-lg font-semibold mb-4">Sequência</h3>
                <StreakIndicator
                  currentStreak={gamification.current_streak_days}
                  longestStreak={gamification.longest_streak_days}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Conquistas ({badges.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {badges.map((userBadge) => (
                    <BadgeCard
                      key={userBadge.id}
                      name={userBadge.badges.name}
                      description={userBadge.badges.description}
                      icon={userBadge.badges.icon}
                      category={userBadge.badges.category}
                      earned={true}
                      earnedAt={userBadge.earned_at}
                    />
                  ))}
                </div>
                {badges.length === 0 && (
                  <Card className="p-12 text-center">
                    <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Nenhuma conquista ainda</p>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default PublicProfile;
