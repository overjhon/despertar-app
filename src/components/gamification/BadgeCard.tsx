import { Card } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BadgeCardProps {
  name: string;
  description: string;
  icon: string;
  category: string;
  earned: boolean;
  earnedAt?: string;
}

export const BadgeCard = ({
  name,
  description,
  icon,
  category,
  earned,
  earnedAt,
}: BadgeCardProps) => {
  const categoryColors = {
    reading: 'border-primary/50 bg-primary/5',
    community: 'border-secondary/50 bg-secondary/5',
    special: 'border-accent/50 bg-accent/5',
  };

  return (
    <Card
      className={cn(
        'p-4 transition-all hover:shadow-md',
        earned ? categoryColors[category as keyof typeof categoryColors] : 'opacity-50 grayscale',
        !earned && 'border-dashed'
      )}
    >
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="relative">
          <div className={cn(
            'text-4xl',
            !earned && 'blur-sm'
          )}>
            {icon}
          </div>
          {!earned && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div>
          <h4 className="font-semibold text-sm">{name}</h4>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
          {earned && earnedAt && (
            <p className="text-xs text-primary mt-2">
              Conquistado em {new Date(earnedAt).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
