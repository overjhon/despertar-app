import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Clock, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChallengeCardProps {
  challenge: {
    id: string;
    current_progress: number;
    completed: boolean;
    claimed: boolean;
    challenges: {
      name: string;
      description: string;
      type: string;
      goal_value: number;
      xp_reward: number;
      end_date: string;
    };
  };
  onClaim: (id: string) => void;
}

export const ChallengeCard = ({ challenge, onClaim }: ChallengeCardProps) => {
  const { current_progress, completed, claimed, challenges: challengeData } = challenge;
  const progressPercentage = (current_progress / challengeData.goal_value) * 100;

  const getTimeRemaining = () => {
    const now = new Date();
    const end = new Date(challengeData.end_date);
    const diff = end.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Expira em breve';
  };

  const getTypeColor = () => {
    switch (challengeData.type) {
      case 'daily':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'weekly':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'monthly':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'special':
        return 'bg-red-600/10 text-red-600 border-red-600/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <Card
      className={cn(
        'p-6 transition-all',
        completed && !claimed && 'border-primary border-2 shadow-lg',
        claimed && 'opacity-75'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">{challengeData.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{challengeData.description}</p>
        </div>
        <Badge variant="outline" className={getTypeColor()}>
          {challengeData.type === 'daily' && 'Diário'}
          {challengeData.type === 'weekly' && 'Semanal'}
          {challengeData.type === 'monthly' && 'Mensal'}
          {challengeData.type === 'special' && 'Especial'}
        </Badge>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            Progresso: {current_progress} / {challengeData.goal_value}
          </span>
          <span className="font-semibold text-primary">{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{getTimeRemaining()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="w-4 h-4" />
            <span className="text-primary font-semibold">+{challengeData.xp_reward} XP</span>
          </div>
        </div>

        {completed && !claimed && (
          <Button onClick={() => onClaim(challenge.id)} className="gap-2">
            <Award className="w-4 h-4" />
            Reivindicar
          </Button>
        )}

        {claimed && (
          <Badge variant="secondary" className="gap-1">
            ✓ Completo
          </Badge>
        )}
      </div>
    </Card>
  );
};
