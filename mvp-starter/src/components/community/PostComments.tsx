import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePostInteractions } from '@/hooks/usePostInteractions';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PostCommentsProps {
  postId: string;
  postAuthorId: string;
}

export const PostComments = ({ postId, postAuthorId }: PostCommentsProps) => {
  const { user } = useAuth();
  const { comments, addComment, deleteComment } = usePostInteractions(postId, postAuthorId);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    const result = await addComment(newComment);
    if (result.success) {
      setNewComment('');
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId);
  };

  return (
    <div className="border-t border-border bg-muted/30 animate-in slide-in-from-top-2 duration-300">
      {/* Lista de comentários */}
      {comments.length > 0 && (
        <ScrollArea className="max-h-80">
          <div className="p-4 space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={comment.profiles.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30">
                    {comment.profiles.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="bg-card rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm">{comment.profiles.full_name}</p>
                      {user?.id === comment.user_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm break-words">{comment.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-3">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Input de novo comentário */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30">
              {user?.user_metadata?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Escreva um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={500}
              className="flex-1"
              disabled={submitting}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!newComment.trim() || submitting}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
