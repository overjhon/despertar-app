import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { UserStatusPreview } from './UserStatusPreview';

interface TestimonialCardProps {
  testimonial: {
    id: string;
    user_id: string;
    rating: number;
    title: string;
    content: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    isLiked: boolean;
    profiles: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    };
    ebooks: {
      title: string;
      cover_url: string;
    };
  };
  onLike: (id: string) => void;
  onComment?: (id: string) => void;
}

export const TestimonialCard = ({ testimonial, onLike, onComment }: TestimonialCardProps) => {
  const { profiles, ebooks, rating, title, content, likes_count, comments_count, created_at, isLiked } = testimonial;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <Link to={`/user/${testimonial.user_id}`}>
          <Avatar className="w-12 h-12 ring-2 ring-border hover:ring-primary transition-all cursor-pointer">
            <AvatarImage src={profiles.avatar_url || undefined} />
            <AvatarFallback>{profiles.full_name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link to={`/user/${testimonial.user_id}`}>
              <h4 className="font-semibold hover:text-primary transition-colors cursor-pointer">
                {profiles.full_name}
              </h4>
            </Link>
            <span className="text-xs text-muted-foreground">
              {new Date(created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <UserStatusPreview userId={testimonial.user_id} />
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <BookOpen className="w-4 h-4" />
            <span>{ebooks.title}</span>
          </div>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className={cn(
              "text-xl",
              star <= rating ? "text-yellow-500" : "text-gray-300"
            )}>
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground whitespace-pre-wrap">{content}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onLike(testimonial.id)}
          className={cn(
            "gap-2",
            isLiked && "text-red-500 hover:text-red-600"
          )}
        >
          <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
          <span>{likes_count}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onComment?.(testimonial.id)}
          className="gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{comments_count}</span>
        </Button>
      </div>
    </Card>
  );
};
