import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatComparison {
  label: string;
  userValue: number;
  avgValue: number;
  unit: string;
  format?: (value: number) => string;
}

interface UserStatsComparisonProps {
  stats: StatComparison[];
}

export const UserStatsComparison = ({ stats }: UserStatsComparisonProps) => {
  const getTrendIcon = (userValue: number, avgValue: number) => {
    const diff = ((userValue - avgValue) / (avgValue || 1)) * 100;
    
    if (diff > 10) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (diff < -10) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getProgressColor = (userValue: number, avgValue: number) => {
    if (userValue > avgValue) return 'bg-green-500';
    if (userValue < avgValue) return 'bg-orange-500';
    return 'bg-primary';
  };

  const calculatePercentage = (userValue: number, avgValue: number) => {
    if (avgValue === 0) return userValue > 0 ? 100 : 0;
    const max = Math.max(userValue, avgValue) * 1.2; // 20% margin
    return (userValue / max) * 100;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Você vs. Média da Plataforma</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {stats.map((stat, index) => {
          const percentage = calculatePercentage(stat.userValue, stat.avgValue);
          const diff = ((stat.userValue - stat.avgValue) / (stat.avgValue || 1)) * 100;
          const formattedUser = stat.format ? stat.format(stat.userValue) : stat.userValue;
          const formattedAvg = stat.format ? stat.format(stat.avgValue) : stat.avgValue;

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{stat.label}</span>
                  {getTrendIcon(stat.userValue, stat.avgValue)}
                </div>
                <span className={cn(
                  "text-sm font-semibold",
                  stat.userValue > stat.avgValue ? "text-green-600" : 
                  stat.userValue < stat.avgValue ? "text-orange-600" : 
                  "text-muted-foreground"
                )}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(0)}%
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Você: <span className="font-bold text-foreground">{formattedUser}</span> {stat.unit}</span>
                  <span>Média: <span className="font-bold">{formattedAvg}</span> {stat.unit}</span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div 
                    className={cn("h-full transition-all duration-500", getProgressColor(stat.userValue, stat.avgValue))}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
