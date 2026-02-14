import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RankingCardProps {
  rank: number;
  userName: string;
  avatarUrl?: string;
  value: number;
  metric: string;
  isCurrentUser?: boolean;
}

export const RankingCard = ({ 
  rank, 
  userName, 
  avatarUrl, 
  value, 
  metric,
  isCurrentUser 
}: RankingCardProps) => {
  const getRankIcon = () => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const getRankBadgeStyle = () => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-yellow-400';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-gray-300';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-500';
    return 'bg-muted text-muted-foreground border-muted';
  };

  const getCardStyle = () => {
    if (isCurrentUser) return 'border-primary bg-primary/5 shadow-md';
    if (rank <= 3) return 'border-primary/20 bg-gradient-to-br from-primary/5 to-transparent';
    return '';
  };

  return (
    <Card className={cn(
      'p-4 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]',
      getCardStyle()
    )}>
      <div className="flex items-center gap-4">
        {/* Rank Badge */}
        <div className="flex-shrink-0">
          <Badge 
            variant="outline" 
            className={cn(
              'h-12 w-12 rounded-full flex items-center justify-center text-base font-bold border-2',
              getRankBadgeStyle()
            )}
          >
            {rank <= 3 ? getRankIcon() : `#${rank}`}
          </Badge>
        </div>

        {/* Avatar */}
        <Avatar className="h-14 w-14 border-2 border-border">
          <AvatarImage src={avatarUrl} alt={userName} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {userName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={cn(
              "font-semibold truncate",
              isCurrentUser && "text-primary"
            )}>
              {userName}
            </p>
            {isCurrentUser && (
              <Badge variant="default" className="text-xs">VOCÊ</Badge>
            )}
            {rank <= 10 && !isCurrentUser && (
              <TrendingUp className="w-4 h-4 text-green-500" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{value.toLocaleString('pt-BR')}</span> {metric}
          </p>
        </div>
      </div>
    </Card>
  );
};
