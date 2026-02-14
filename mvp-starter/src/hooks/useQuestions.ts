import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useXP } from './useXP';

interface Question {
  id: string;
  ebook_id: string;
  user_id: string | null;
  question: string;
  is_answered: boolean;
  helpful_count: number;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  question_answers: Answer[];
}

interface Answer {
  id: string;
  question_id: string;
  user_id: string | null;
  answer: string;
  is_verified_purchaser: boolean;
  is_official: boolean;
  helpful_count: number;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export const useQuestions = (ebookId: string) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const { addXP } = useXP();

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('ebook_questions')
        .select(`
          *,
          profiles (full_name, avatar_url),
          question_answers (
            *,
            profiles (full_name, avatar_url)
          )
        `)
        .eq('ebook_id', ebookId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setQuestions((data as any) || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ebookId) {
      fetchQuestions();
    }
  }, [ebookId]);

  const askQuestion = async (question: string) => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para fazer perguntas',
      });
      return { success: false };
    }

    try {
      const { error } = await supabase
        .from('ebook_questions')
        .insert({
          ebook_id: ebookId,
          user_id: user.id,
          question,
        });

      if (error) throw error;

      toast({
        title: '✅ Pergunta enviada!',
        description: 'Você ganhou +10 XP',
      });

      await addXP({
        amount: 10,
        reason: 'Fez uma pergunta',
        relatedEbookId: ebookId,
      });

      await fetchQuestions();
      return { success: true };
    } catch (error: any) {
      console.error('Error asking question:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível enviar a pergunta',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const answerQuestion = async (questionId: string, answer: string) => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para responder perguntas',
      });
      return { success: false };
    }

    try {
      // Check if user purchased the ebook
      const { data: purchase } = await supabase
        .from('user_ebooks')
        .select('id')
        .eq('user_id', user.id)
        .eq('ebook_id', ebookId)
        .maybeSingle();

      const { error } = await supabase
        .from('question_answers')
        .insert({
          question_id: questionId,
          user_id: user.id,
          answer,
          is_verified_purchaser: !!purchase,
        });

      if (error) throw error;

      toast({
        title: '✅ Resposta enviada!',
        description: 'Você ganhou +20 XP',
      });

      await addXP({
        amount: 20,
        reason: 'Respondeu uma pergunta',
        relatedEbookId: ebookId,
      });

      await fetchQuestions();
      return { success: true };
    } catch (error: any) {
      console.error('Error answering question:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível enviar a resposta',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  return {
    questions,
    loading,
    askQuestion,
    answerQuestion,
    refetch: fetchQuestions,
  };
};
