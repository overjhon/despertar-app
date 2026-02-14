import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, ArrowLeft, Calendar, Trophy, Clock, Edit2, Sparkles, Heart, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useGamification } from '@/hooks/useGamification';
import { useBadges } from '@/hooks/useBadges';
import { XPBar } from '@/components/gamification/XPBar';
import { BadgeCard } from '@/components/gamification/BadgeCard';
import { StreakIndicator } from '@/components/gamification/StreakIndicator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { useIsMobile } from '@/hooks/useIsMobile';

interface Stats {
  totalEbooks: number;
  completedEbooks: number;
  totalPages: number;
  totalMinutes: number;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    totalEbooks: 0,
    completedEbooks: 0,
    totalPages: 0,
    totalMinutes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const { gamificationData, loading: gamLoading } = useGamification();
  const { allBadges, userBadges, loading: badgesLoading, getBadgeProgress } = useBadges();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProfile();
    fetchStats();
  }, [user, navigate]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();

    if (!error && data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    // Total ebooks
    const { data: userEbooks } = await supabase
      .from('user_ebooks')
      .select('ebook_id')
      .eq('user_id', user?.id);

    const totalEbooks = userEbooks?.length || 0;

    // Completed ebooks
    const { data: completedData } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user?.id)
      .eq('completed', true);

    const completedEbooks = completedData?.length || 0;

    // Total reading time
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('reading_time_minutes')
      .eq('user_id', user?.id);

    const totalMinutes = progressData?.reduce((sum, p) => sum + (p.reading_time_minutes || 0), 0) || 0;

    setStats({
      totalEbooks,
      completedEbooks,
      totalPages: 0,
      totalMinutes,
    });
  };

  if (loading || gamLoading || badgesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  const badgeProgress = getBadgeProgress();

  const initials = profile?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 ${isMobile ? 'pb-20' : ''}`}>
      <header className="bg-card/80 backdrop-blur-sm border-b border-primary/20 sticky top-0 z-10 shadow-elegant">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            {!isMobile && (
              <Link to="/library">
                <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
            )}
            <h1 className="font-heading text-2xl font-bold text-primary">
              Meu Perfil
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Profile Card */}
        <Card className="mb-8 shadow-elegant animate-scale-in border-2 border-primary/20 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary via-primary-light to-primary" />
          <CardContent className="pt-0 -mt-12">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="w-28 h-28 mb-4 border-4 border-card shadow-xl">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-3xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-3 right-0 h-9 w-9 rounded-full shadow-lg hover:scale-110 transition-transform border-2 border-card"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {profile?.full_name}
              </h2>
              {profile?.bio && (
                <p className="text-foreground/70 mb-3 max-w-md italic">{profile.bio}</p>
              )}
              <p className="text-muted-foreground text-sm mb-2">{user?.email}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full">
                <Calendar className="w-4 h-4" />
                <span>Membro desde {new Date(profile?.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="stats" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-card p-1 shadow-md">
            <TabsTrigger 
              value="stats"
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <Heart className="w-4 h-4 mr-2" />
              🌟 Minha Jornada
            </TabsTrigger>
            <TabsTrigger 
              value="gamification"
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <Sparkles className="w-4 w-4 mr-2" />
              ✨ Conquistas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-lg hover:shadow-xl transition-all border-primary/20 hover:border-primary/40 hover:scale-105">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Minha Coleção
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary">
                      {stats.totalEbooks}
                    </div>
                    <p className="text-sm text-muted-foreground">ebooks na sua coleção 📚</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-all border-accent/20 hover:border-accent/40 hover:scale-105">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Finalizados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-secondary">
                      {stats.completedEbooks}
                    </div>
                    <p className="text-sm text-muted-foreground">receitas dominadas ⭐</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-all border-primary/20 hover:border-primary/40 hover:scale-105">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Dedicação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {Math.round(stats.totalMinutes / 60)}h
                    </div>
                    <p className="text-xs text-muted-foreground">de pura inspiração</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="gamification" className="space-y-6">
            {gamificationData && (
              <>
                {/* XP and Level */}
                <Card className="p-6 shadow-xl border-primary/20 bg-gradient-to-br from-card to-card-hover">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    Seu Progresso
                  </h3>
                  <XPBar 
                    currentXP={gamificationData.total_xp} 
                    currentLevel={gamificationData.current_level} 
                  />
                </Card>

                {/* Streak */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    Sua Sequência
                  </h3>
                  <StreakIndicator 
                    currentStreak={gamificationData.current_streak_days}
                    longestStreak={gamificationData.longest_streak_days}
                  />
                </div>

                {/* Badges */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      Suas Conquistas
                    </h3>
                    <div className="bg-primary/10 px-3 py-1 rounded-full">
                      <p className="text-sm font-semibold text-primary">
                        {badgeProgress.earned} / {badgeProgress.total}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {allBadges.map((badge) => {
                      const userBadge = userBadges.find(ub => ub.badge_id === badge.id);
                      return (
                        <BadgeCard
                          key={badge.id}
                          name={badge.name}
                          description={badge.description}
                          icon={badge.icon}
                          category={badge.category}
                          earned={!!userBadge}
                          earnedAt={userBadge?.earned_at}
                        />
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="space-y-3">
          <Button variant="destructive" className="w-full shadow-md hover:shadow-lg transition-all" onClick={signOut}>
            Sair da Conta
          </Button>
        </div>
      </main>

      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        profile={profile || { full_name: '', bio: '', avatar_url: '' }}
        onUpdate={fetchProfile}
      />
    </div>
  );
};

export default Profile;