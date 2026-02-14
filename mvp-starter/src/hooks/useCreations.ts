import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useXP } from './useXP';

interface Creation {
  id: string;
  user_id: string;
  ebook_id: string | null;
  title: string;
  description: string | null;
  image_url: string;
  ingredients: any;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  likes_count: number;
  saves_count: number;
  is_featured: boolean;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
  ebooks: {
    title: string;
  } | null;
}

interface CreationWithLike extends Creation {
  isLiked: boolean;
}

export const useCreations = () => {
  const { user } = useAuth();
  const [creations, setCreations] = useState<CreationWithLike[]>([]);
  const [loading, setLoading] = useState(true);
  const { addXP } = useXP();

  const fetchCreations = async () => {
    try {
      const { data, error } = await supabase
        .from('community_creations')
        .select(`
          *,
          profiles (full_name, avatar_url),
          ebooks (title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (user && data) {
        const { data: likes } = await supabase
          .from('creation_likes')
          .select('creation_id')
          .eq('user_id', user.id);

        const likedIds = new Set(likes?.map(l => l.creation_id) || []);

        const creationsWithLikes = (data as any[]).map((c: any) => ({
          ...c,
          isLiked: likedIds.has(c.id),
        })) as CreationWithLike[];

        setCreations(creationsWithLikes);
      } else {
        const creationsData = ((data as any[]) || []).map((c: any) => ({ 
          ...c, 
          isLiked: false 
        })) as CreationWithLike[];
        setCreations(creationsData);
      }
    } catch (error) {
      console.error('Error fetching creations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreations();
  }, [user]);

  const createCreation = async (
    title: string,
    description: string,
    imageUrl: string,
    ebookId: string | null,
    difficulty: 'easy' | 'medium' | 'hard',
    ingredients?: any
  ) => {
    if (!user) return { success: false };

    try {
      const { error } = await supabase
        .from('community_creations')
        .insert({
          user_id: user.id,
          title,
          description,
          image_url: imageUrl,
          ebook_id: ebookId,
          difficulty,
          ingredients,
        });

      if (error) throw error;

      await addXP({
        amount: 100,
        reason: 'Compartilhou uma criação',
        relatedEbookId: ebookId || undefined,
      });

      toast({
        title: '✅ Criação publicada!',
        description: 'Você ganhou +100 XP',
      });

      await fetchCreations();
      return { success: true };
    } catch (error: any) {
      console.error('Error creating creation:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível publicar a criação',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const toggleLike = async (creationId: string) => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para curtir criações',
      });
      return;
    }

    try {
      const creation = creations.find(c => c.id === creationId);
      if (!creation) return;

      if (creation.isLiked) {
        await supabase
          .from('creation_likes')
          .delete()
          .eq('creation_id', creationId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('creation_likes')
          .insert({
            creation_id: creationId,
            user_id: user.id,
          });
      }

      await fetchCreations();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  return {
    creations,
    loading,
    createCreation,
    toggleLike,
    refetch: fetchCreations,
  };
};
