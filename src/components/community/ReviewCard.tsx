import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReviewCardProps {
  review: {
    id: string;
    user_id: string;
    rating: number;
    title: string;
    content: string;
    likes_count: number;
    comments_count: number;
    isLiked: boolean;
    created_at: string;
    profiles: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    };
    ebooks: {
      title: string;
    };
  };
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  showVerifiedBadge?: boolean;
}

export const ReviewCard = ({ review, onLike, onComment, showVerifiedBadge = false }: ReviewCardProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <Avatar>
          <AvatarImage src={review.profiles.avatar_url || undefined} />
          <AvatarFallback>{review.profiles.full_name[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{review.profiles.full_name}</span>
                {showVerifiedBadge && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    🏆 Comprador Verificado
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(review.created_at), { 
                  addSuffix: true,
                  locale: ptBR 
                })}
              </p>
            </div>

            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}>
                  ⭐
                </span>
              ))}
            </div>
          </div>

          <h3 className="font-semibold mb-2">{review.title}</h3>
          <p className="text-muted-foreground mb-4">{review.content}</p>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(review.id)}
              className={review.isLiked ? 'text-primary' : ''}
            >
              <Heart className={`w-4 h-4 mr-1 ${review.isLiked ? 'fill-current' : ''}`} />
              {review.likes_count}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComment(review.id)}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              {review.comments_count}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
