import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CommunityPost } from '@/hooks/useCommunityPosts';
import { useAuth } from '@/contexts/AuthContext';
import { PostComments } from './PostComments';
import { usePostInteractions } from '@/hooks/usePostInteractions';
import { Link } from 'react-router-dom';
import { UserStatusPreview } from './UserStatusPreview';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PostCardProps {
  post: CommunityPost;
  onDelete: (postId: string) => Promise<{ success: boolean }>;
}

export const PostCard = ({ post, onDelete }: PostCardProps) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { likesCount, isLiked, toggleLike } = usePostInteractions(post.id, post.user_id);

  const isOwner = user?.id === post.user_id;
  const hasVideo = post.media_urls?.some(url => url.includes('.mp4') || url.includes('.mov') || url.includes('.webm'));
  const images = post.media_urls?.filter(url => !url.includes('.mp4') && !url.includes('.mov') && !url.includes('.webm')) || [];
  const video = post.media_urls?.find(url => url.includes('.mp4') || url.includes('.mov') || url.includes('.webm'));

  const handleDelete = async () => {
    await onDelete(post.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
        {/* Header do post */}
        <div className="p-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/user/${post.user_id}`}>
              <Avatar className="w-12 h-12 border-2 border-border hover:border-primary transition-all cursor-pointer">
                <AvatarImage src={post.profiles.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                  {post.profiles.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 space-y-1">
              <Link to={`/user/${post.user_id}`}>
                <p className="font-semibold hover:text-primary transition-colors cursor-pointer">
                  {post.profiles.full_name}
                </p>
              </Link>
              <UserStatusPreview userId={post.user_id} />
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
          
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Conteúdo do post */}
        {post.content && (
          <div className="px-4 pb-3">
            <p className="whitespace-pre-wrap break-words">{post.content}</p>
          </div>
        )}

        {/* Mídia */}
        {video && (
          <video 
            src={video} 
            controls 
            className="w-full max-h-96 bg-black"
            preload="metadata"
          />
        )}

        {images.length > 0 && (
          <div className={`grid gap-1 ${
            images.length === 1 ? 'grid-cols-1' : 
            images.length === 2 ? 'grid-cols-2' :
            images.length === 3 ? 'grid-cols-2' :
            'grid-cols-2'
          }`}>
            {images.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Post media ${index + 1}`}
                className={`w-full object-cover ${
                  images.length === 1 ? 'max-h-96' :
                  images.length === 3 && index === 0 ? 'col-span-2 max-h-64' :
                  'h-48'
                }`}
              />
            ))}
          </div>
        )}

        {/* Footer com contadores */}
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-muted-foreground">
              {likesCount > 0 ? `${likesCount} ${likesCount === 1 ? 'curtida' : 'curtidas'}` : ''}
            </span>
            <button
              onClick={() => setShowComments(!showComments)}
              className="text-muted-foreground hover:text-primary hover:underline transition-colors cursor-pointer"
            >
              {post.comments_count > 0 
                ? `${post.comments_count} ${post.comments_count === 1 ? 'comentário' : 'comentários'}`
                : 'Ver comentários'
              }
            </button>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`flex-1 ${isLiked ? 'text-red-500 hover:text-red-600' : ''}`}
              onClick={toggleLike}
            >
              <Heart className={`w-5 h-5 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              Curtir
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Comentar
            </Button>
          </div>
        </div>

        {/* Seção de comentários */}
        {showComments && <PostComments postId={post.id} postAuthorId={post.user_id} />}
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar postagem?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Sua postagem será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
