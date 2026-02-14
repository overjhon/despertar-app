import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

interface LevelBadgeProps {
  level: number;
  levelName: string;
}

export const LevelBadge = ({ level, levelName }: LevelBadgeProps) => {
  return (
    <Badge variant="secondary" className="gap-1 px-3 py-1">
      <Trophy className="w-3 h-3" />
      <span className="font-semibold">Nv. {level}</span>
      <span className="text-muted-foreground">•</span>
      <span>{levelName}</span>
    </Badge>
  );
};
