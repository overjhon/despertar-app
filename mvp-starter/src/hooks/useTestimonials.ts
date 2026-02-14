import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useBadges } from './useBadges';
import { useXP } from './useXP';

interface Testimonial {
  id: string;
  user_id: string;
  ebook_id: string;
  rating: number;
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  is_public: boolean;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  ebooks: {
    title: string;
    cover_url: string;
  };
}

interface TestimonialWithLike extends Testimonial {
  isLiked: boolean;
}

export const useTestimonials = () => {
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState<TestimonialWithLike[]>([]);
  const [loading, setLoading] = useState(true);
  const { allBadges, awardBadge } = useBadges();
  const { addXP } = useXP();

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select(`
          *,
          profiles (id, full_name, avatar_url),
          ebooks (title, cover_url)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar testimonials:', error);
        // Se a tabela não existir ou houver erro de relacionamento, retorna array vazio
        if (error.code === 'PGRST116' || error.code === '42P01' || error.code === 'PGRST200') {
          console.warn('⚠️ Tabela testimonials ou relacionamentos não configurados ainda');
          setTestimonials([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      // Check which testimonials the current user has liked
      if (user && data) {
        const { data: likes } = await supabase
          .from('testimonial_likes')
          .select('testimonial_id')
          .eq('user_id', user.id);

        const likedIds = new Set(likes?.map(l => l.testimonial_id) || []);

        const testimonialsWithLikes = (data as any[]).map((t: any) => ({
          ...t,
          isLiked: likedIds.has(t.id),
        })) as TestimonialWithLike[];

        setTestimonials(testimonialsWithLikes);
      } else {
        const testimonialsData = ((data as any[]) || []).map((t: any) => ({ 
          ...t, 
          isLiked: false 
        })) as TestimonialWithLike[];
        setTestimonials(testimonialsData);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, [user]);

  const createTestimonial = async (ebookId: string, rating: number, title: string, content: string) => {
    if (!user) return { success: false };

    try {
      const { error } = await supabase
        .from('testimonials')
        .insert({
          user_id: user.id,
          ebook_id: ebookId,
          rating,
          title,
          content,
        });

      if (error) throw error;

      toast({
        title: '✅ Depoimento publicado!',
        description: 'Você ganhou +150 XP',
      });

      await fetchTestimonials();
      return { success: true };
    } catch (error: any) {
      console.error('Error creating testimonial:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível publicar o depoimento',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const toggleLike = async (testimonialId: string) => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para curtir depoimentos',
      });
      return;
    }

    try {
      const testimonial = testimonials.find(t => t.id === testimonialId);
      if (!testimonial) return;

      if (testimonial.isLiked) {
        // Unlike
        await supabase
          .from('testimonial_likes')
          .delete()
          .eq('testimonial_id', testimonialId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('testimonial_likes')
          .insert({
            testimonial_id: testimonialId,
            user_id: user.id,
          });

        // Award XP to the testimonial author when their testimonial gets liked
        if (testimonial.user_id !== user.id) {
          await addXP({
            amount: 20,
            reason: 'Recebeu uma curtida em um depoimento',
            relatedEbookId: testimonial.ebook_id,
            showToast: false,
          });
        }
      }

      await fetchTestimonials();
      await checkCommunityBadges();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const checkCommunityBadges = async () => {
    if (!user) return;

    // Check total testimonials for Comunicador badge
    const { data: userTestimonials } = await supabase
      .from('testimonials')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);

    const testimonialCount = userTestimonials?.length || 0;

    if (testimonialCount >= 10) {
      const badge = allBadges.find(b => b.name === 'Comunicador');
      if (badge) await awardBadge(badge.id);
    }

    // Check total likes received for Influenciador badge
    const { data: userTestimonialsWithLikes } = await supabase
      .from('testimonials')
      .select('likes_count')
      .eq('user_id', user.id);

    const totalLikes = userTestimonialsWithLikes?.reduce((sum, t) => sum + t.likes_count, 0) || 0;

    if (totalLikes >= 100) {
      const badge = allBadges.find(b => b.name === 'Influenciador');
      if (badge) await awardBadge(badge.id);
    }
  };

  return {
    testimonials,
    loading,
    createTestimonial,
    toggleLike,
    refetch: fetchTestimonials,
  };
};
