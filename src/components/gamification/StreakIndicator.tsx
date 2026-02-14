import { Card } from '@/components/ui/card';
import { Flame, Award } from 'lucide-react';

interface StreakIndicatorProps {
  currentStreak: number;
  longestStreak: number;
}

export const StreakIndicator = ({ currentStreak, longestStreak }: StreakIndicatorProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/20 rounded-full p-3">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">Dias seguidos</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 rounded-full p-3">
            <Award className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{longestStreak}</p>
            <p className="text-xs text-muted-foreground">Maior sequência</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
