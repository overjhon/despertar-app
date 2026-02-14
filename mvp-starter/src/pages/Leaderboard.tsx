import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLeaderboards } from '@/hooks/useLeaderboards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Trophy, TrendingUp, BookOpen, Flame, Clock, Calendar, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyLeaderboardState } from '@/components/gamification/EmptyLeaderboardState';
import { RankingCard } from '@/components/gamification/RankingCard';
import { UserStatsComparison } from '@/components/gamification/UserStatsComparison';
import { Badge } from '@/components/ui/badge';

const Leaderboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
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
    comparativeStats 
  } = useLeaderboards();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    return `${hours}h ${mins}min`;
  };

  const getMetricForType = (leader: any, type: string) => {
    switch(type) {
      case 'pages': return { value: leader.total_pages_read || 0, metric: 'páginas' };
      case 'books': return { value: leader.books_completed || 0, metric: 'livros' };
      case 'streaks': return { value: leader.longest_streak_days || 0, metric: 'dias de streak' };
      case 'time': return { value: leader.total_reading_time_minutes || 0, metric: 'minutos' };
      default: return { value: leader.total_xp || 0, metric: 'XP' };
    }
  };

  const renderLeaderboardList = (leaders: any[], type: string) => {
    if (!leaders || leaders.length === 0) {
      const emptyType = type === 'general' ? 'general' : 
                        type === 'daily' ? 'daily' :
                        type === 'weekly' ? 'weekly' :
                        type === 'monthly' ? 'monthly' :
                        type === 'pages' ? 'pages' :
                        type === 'books' ? 'books' :
                        type === 'streaks' ? 'streaks' : 'time';
      return <EmptyLeaderboardState type={emptyType as any} />;
    }

    return (
      <div className="space-y-4">
        {leaders.map((leader, index) => {
          const rank = index + 1;
          const isCurrentUser = user?.id === leader.user_id;
          const { value, metric } = getMetricForType(leader, type);

          return (
            <RankingCard
              key={leader.user_id}
              rank={rank}
              userName={leader.full_name || 'Usuário'}
              avatarUrl={leader.avatar_url}
              value={value}
              metric={metric}
              isCurrentUser={isCurrentUser}
            />
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Skeleton className="h-80 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
          </div>

          <Skeleton className="h-12 w-full rounded-lg mb-6" />
          
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover-scale">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              Rankings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Veja sua posição e compare com outros leitores
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Suas Posições
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Geral</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {userRankings.allTime ? `#${userRankings.allTime}` : '-'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Hoje</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {userRankings.daily ? `#${userRankings.daily}` : '-'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Páginas</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {userRankings.pages ? `#${userRankings.pages}` : '-'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">Streak</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {userRankings.streaks ? `#${userRankings.streaks}` : '-'}
                  </p>
                </div>
              </div>

              {userRankings.allTime && userRankings.allTime <= 10 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Você está no Top 10! 🎉
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <UserStatsComparison 
            stats={[
              {
                label: 'XP Total',
                userValue: comparativeStats.userXP || 0,
                avgValue: comparativeStats.avgXP || 0,
                unit: 'XP'
              },
              {
                label: 'Páginas Lidas',
                userValue: comparativeStats.userPages || 0,
                avgValue: comparativeStats.avgPages || 0,
                unit: 'págs'
              },
              {
                label: 'Livros Completos',
                userValue: comparativeStats.userBooks || 0,
                avgValue: comparativeStats.avgBooks || 0,
                unit: 'livros'
              }
            ]}
          />
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-4 md:grid-cols-8 w-full h-auto gap-2 bg-muted/50 p-2 rounded-lg">
            <TabsTrigger value="general" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Trophy className="w-4 h-4" />
              <span className="text-xs md:text-sm">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="daily" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Calendar className="w-4 h-4" />
              <span className="text-xs md:text-sm">Hoje</span>
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs md:text-sm">Semana</span>
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              <Calendar className="w-4 h-4" />
              <span className="text-xs md:text-sm">Mês</span>
            </TabsTrigger>
            <TabsTrigger value="pages" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs md:text-sm">Páginas</span>
            </TabsTrigger>
            <TabsTrigger value="books" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs md:text-sm">Livros</span>
            </TabsTrigger>
            <TabsTrigger value="streaks" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Flame className="w-4 h-4" />
              <span className="text-xs md:text-sm">Streaks</span>
            </TabsTrigger>
            <TabsTrigger value="time" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 data-[state=active]:bg-pink-500 data-[state=active]:text-white">
              <Clock className="w-4 h-4" />
              <span className="text-xs md:text-sm">Tempo</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Ranking Geral por XP</span>
                  <Badge variant="secondary">{allTimeLeaders.length} leitores</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderLeaderboardList(allTimeLeaders, 'general')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Ranking de Hoje</span>
                  <Badge variant="secondary">{dailyLeaders.length} leitores</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderLeaderboardList(dailyLeaders, 'daily')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Ranking da Semana</span>
                  <Badge variant="secondary">{weeklyLeaders.length} leitores</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderLeaderboardList(weeklyLeaders, 'weekly')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Ranking do Mês</span>
                  <Badge variant="secondary">{monthlyLeaders.length} leitores</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderLeaderboardList(monthlyLeaders, 'monthly')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Ranking por Páginas Lidas</span>
                  <Badge variant="secondary">{pagesLeaders.length} leitores</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderLeaderboardList(pagesLeaders, 'pages')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="books" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Ranking por Livros Completados</span>
                  <Badge variant="secondary">{booksLeaders.length} leitores</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderLeaderboardList(booksLeaders, 'books')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="streaks" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Ranking por Maior Sequência</span>
                  <Badge variant="secondary">{streaksLeaders.length} leitores</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderLeaderboardList(streaksLeaders, 'streaks')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="time" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Ranking por Tempo de Leitura</span>
                  <Badge variant="secondary">{timeLeaders.length} leitores</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderLeaderboardList(timeLeaders, 'time')}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Leaderboard;
