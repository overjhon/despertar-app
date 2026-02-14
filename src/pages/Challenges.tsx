import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Target, Trophy } from 'lucide-react';
import { useChallenges } from '@/hooks/useChallenges';
import { useXP } from '@/hooks/useXP';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/useIsMobile';

const Challenges = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { challenges, loading, claimReward } = useChallenges();
  const { addXP } = useXP();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleClaimReward = async (userChallengeId: string) => {
    const result = await claimReward(userChallengeId);
    if (result.success && result.xpReward) {
      await addXP({
        amount: result.xpReward,
        reason: 'Completou um desafio',
        showToast: true,
      });
    }
  };

  const activeChallenges = challenges.filter(c => !c.completed);
  const completedChallenges = challenges.filter(c => c.completed && !c.claimed);
  const claimedChallenges = challenges.filter(c => c.claimed);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Target className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando desafios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'pb-20' : ''}`}>
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!isMobile && (
                <Link to="/library">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
              )}
              <div className="flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Desafios</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 rounded-full p-3">
                  <Target className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeChallenges.length}</p>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/20 rounded-full p-3">
                  <Trophy className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedChallenges.length}</p>
                  <p className="text-sm text-muted-foreground">Completados</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 rounded-full p-3">
                  <Trophy className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{claimedChallenges.length}</p>
                  <p className="text-sm text-muted-foreground">Reivindicados</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Ativos ({activeChallenges.length})</TabsTrigger>
              <TabsTrigger value="completed">
                Completados ({completedChallenges.length})
              </TabsTrigger>
              <TabsTrigger value="claimed">Reivindicados ({claimedChallenges.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4 mt-6">
              {activeChallenges.length === 0 ? (
                <Card className="p-12 text-center">
                  <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum desafio ativo</h3>
                  <p className="text-muted-foreground">
                    Novos desafios aparecem regularmente. Continue lendo!
                  </p>
                </Card>
              ) : (
                activeChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onClaim={handleClaimReward}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 mt-6">
              {completedChallenges.length === 0 ? (
                <Card className="p-12 text-center">
                  <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum desafio para reivindicar</h3>
                  <p className="text-muted-foreground">
                    Complete desafios para ganhar recompensas!
                  </p>
                </Card>
              ) : (
                completedChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onClaim={handleClaimReward}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="claimed" className="space-y-4 mt-6">
              {claimedChallenges.length === 0 ? (
                <Card className="p-12 text-center">
                  <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum desafio reivindicado ainda</h3>
                  <p className="text-muted-foreground">
                    Seus desafios completados aparecerão aqui
                  </p>
                </Card>
              ) : (
                claimedChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onClaim={handleClaimReward}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Challenges;
