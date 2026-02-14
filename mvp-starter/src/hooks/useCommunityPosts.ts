import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useXP } from './useXP';

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  post_type: string;
  media_urls: string[] | null;
  likes_count: number;
  comments_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  isLiked?: boolean;
}

export const useCommunityPosts = (filters?: { type?: string; sort?: string }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const { user } = useAuth();
  const { addXP } = useXP();

  const fetchPosts = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
      }
      
      const currentPage = loadMore ? page + 1 : 0;
      const limit = 20;
      const from = currentPage * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('community_posts')
        .select(`
          *,
          profiles (
            id,
            full_name,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('is_public', true);

      // Aplicar filtro de tipo
      if (filters?.type && filters.type !== 'all') {
        query = query.eq('post_type', filters.type);
      }

      // Aplicar ordenação
      if (filters?.sort === 'likes') {
        query = query.order('likes_count', { ascending: false });
      } else if (filters?.sort === 'comments') {
        query = query.order('comments_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data: postsData, error: postsError, count } = await query
        .range(from, to);

      if (postsError) throw postsError;

      if (!user) {
        setPosts(postsData || []);
        return;
      }

      // Buscar curtidas do usuário atual
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);

      const likedPostIds = new Set(likesData?.map(like => like.post_id) || []);

      const postsWithLikes = (postsData || []).map(post => ({
        ...post,
        isLiked: likedPostIds.has(post.id)
      }));

      if (loadMore) {
        setPosts(prev => [...prev, ...postsWithLikes]);
        setPage(currentPage);
      } else {
        setPosts(postsWithLikes);
        setPage(0);
      }

      // Verificar se há mais posts
      setHasMore(count ? (from + postsWithLikes.length) < count : false);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Erro ao carregar posts',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (content: string, mediaUrls: string[] = []) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticada para criar um post',
        variant: 'destructive',
      });
      return { success: false };
    }

    try {
      const postType = mediaUrls.length > 0 
        ? (mediaUrls[0].includes('.mp4') || mediaUrls[0].includes('.mov') ? 'video' : 'image')
        : 'text';

      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          content,
          post_type: postType,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Adicionar XP por criar post
      await addXP({
        amount: 10,
        reason: 'Criou uma postagem na comunidade',
        metadata: { post_id: data.id }
      });

      toast({
        title: 'Postagem criada! ✨',
        description: 'Sua postagem foi compartilhada com a comunidade! 💕',
      });

      fetchPosts();
      return { success: true };
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: 'Erro ao criar post',
        description: error.message,
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return { success: false };

    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Post deletado',
        description: 'Sua postagem foi removida',
      });

      fetchPosts();
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Erro ao deletar post',
        description: error.message,
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  useEffect(() => {
    fetchPosts();

    // Real-time subscription para novos posts
    const channel = supabase
      .channel('community-posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_posts'
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(true);
    }
  };

  return {
    posts,
    loading,
    hasMore,
    createPost,
    deletePost,
    loadMore,
    refetch: fetchPosts,
  };
};
