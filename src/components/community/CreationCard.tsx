import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CreationCardProps {
  creation: {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    image_url: string;
    difficulty: 'easy' | 'medium' | 'hard' | null;
    likes_count: number;
    isLiked: boolean;
    is_featured: boolean;
    profiles: {
      full_name: string;
      avatar_url: string | null;
    };
    ebooks: {
      title: string;
    } | null;
  };
  onLike: (id: string) => void;
}

const difficultyColors = {
  easy: 'bg-green-500/10 text-green-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  hard: 'bg-red-500/10 text-red-500',
};

const difficultyLabels = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil',
};

export const CreationCard = ({ creation, onLike }: CreationCardProps) => {
  return (
    <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
      <div className="relative aspect-square">
        <img
          src={creation.image_url}
          alt={creation.title}
          className="w-full h-full object-cover"
        />
        {creation.is_featured && (
          <Badge className="absolute top-2 right-2 bg-primary">
            ⭐ Destaque
          </Badge>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold mb-2 line-clamp-2">{creation.title}</h3>
        
        {creation.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {creation.description}
          </p>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={creation.profiles.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {creation.profiles.full_name[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {creation.profiles.full_name}
            </span>
          </div>

          {creation.difficulty && (
            <Badge variant="secondary" className={difficultyColors[creation.difficulty]}>
              {difficultyLabels[creation.difficulty]}
            </Badge>
          )}
        </div>

        {creation.ebooks && (
          <p className="text-xs text-muted-foreground mb-3">
            📚 De: {creation.ebooks.title}
          </p>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onLike(creation.id);
          }}
          className={`w-full ${creation.isLiked ? 'text-primary' : ''}`}
        >
          <Heart className={`w-4 h-4 mr-2 ${creation.isLiked ? 'fill-current' : ''}`} />
          {creation.likes_count} curtidas
        </Button>
      </div>
    </Card>
  );
};
