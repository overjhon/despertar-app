import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useMediaUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();

  const uploadMedia = async (files: File[]): Promise<string[]> => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticada para fazer upload',
        variant: 'destructive',
      });
      return [];
    }

    if (files.length === 0) return [];

    setUploading(true);
    setProgress(0);

    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('community-media')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('community-media')
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
        setProgress(((i + 1) / files.length) * 100);
      }

      return uploadedUrls;
    } catch (error: any) {
      console.error('Error uploading media:', error);
      toast({
        title: 'Erro ao fazer upload',
        description: error.message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return { uploadMedia, uploading, progress };
};
