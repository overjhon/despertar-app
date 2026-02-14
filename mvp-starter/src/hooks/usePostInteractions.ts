import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useXP } from './useXP';

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export const usePostInteractions = (postId: string, postAuthorId: string) => {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { addXP } = useXP();

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const checkLikeStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsLiked(!!data);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const toggleLike = async () => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticada para curtir',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isLiked) {
        // Remover curtida
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Adicionar curtida
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        if (error) throw error;
        setIsLiked(true);
        setLikesCount(prev => prev + 1);

        // Adicionar XP para o autor do post (se não for o próprio usuário)
        if (postAuthorId !== user.id) {
          await addXP({
            amount: 2,
            reason: 'Recebeu uma curtida no post',
            metadata: { post_id: postId, from_user: user.id }
          });
        }
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const addComment = async (content: string) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticada para comentar',
        variant: 'destructive',
      });
      return { success: false };
    }

    if (!content.trim()) {
      toast({
        title: 'Erro',
        description: 'O comentário não pode estar vazio',
        variant: 'destructive',
      });
      return { success: false };
    }

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
        });

      if (error) throw error;

      // Adicionar XP por comentar
      await addXP({
        amount: 3,
        reason: 'Comentou em um post',
        metadata: { post_id: postId }
      });

      // Adicionar XP para o autor do post (se não for o próprio usuário)
      if (postAuthorId !== user.id) {
        await addXP({
          amount: 5,
          reason: 'Recebeu um comentário no post',
          metadata: { post_id: postId, from_user: user.id }
        });
      }

      toast({
        title: 'Comentário adicionado! 💬',
      });

      fetchComments();
      return { success: true };
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Erro ao adicionar comentário',
        description: error.message,
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return { success: false };

    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Comentário deletado',
      });

      fetchComments();
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Erro ao deletar comentário',
        description: error.message,
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  useEffect(() => {
    fetchComments();
    checkLikeStatus();

    // Real-time subscription para comentários
    const channel = supabase
      .channel(`post-comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, user]);

  return {
    comments,
    likesCount,
    isLiked,
    loading,
    toggleLike,
    addComment,
    deleteComment,
    refetchComments: fetchComments,
  };
};
