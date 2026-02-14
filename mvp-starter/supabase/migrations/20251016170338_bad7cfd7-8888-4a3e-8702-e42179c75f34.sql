-- Criar tabela de posts da comunidade
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type VARCHAR(20) NOT NULL DEFAULT 'text',
  media_urls TEXT[],
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_posts_public ON public.community_posts(is_public) WHERE is_public = true;

-- Criar tabela de curtidas em posts
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON public.post_likes(user_id);

-- Criar tabela de comentários em posts
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX idx_post_comments_created_at ON public.post_comments(created_at);

-- Habilitar RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies para community_posts
CREATE POLICY "Todos podem ver posts públicos"
ON public.community_posts
FOR SELECT
USING (is_public = true);

CREATE POLICY "Usuárias podem criar seus próprios posts"
ON public.community_posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuárias podem atualizar seus próprios posts"
ON public.community_posts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuárias podem deletar seus próprios posts"
ON public.community_posts
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies para post_likes
CREATE POLICY "Todos podem ver curtidas"
ON public.post_likes
FOR SELECT
USING (true);

CREATE POLICY "Usuárias podem adicionar suas próprias curtidas"
ON public.post_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuárias podem remover suas próprias curtidas"
ON public.post_likes
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies para post_comments
CREATE POLICY "Todos podem ver comentários"
ON public.post_comments
FOR SELECT
USING (true);

CREATE POLICY "Usuárias podem criar seus próprios comentários"
ON public.post_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuárias podem atualizar seus próprios comentários"
ON public.post_comments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuárias podem deletar seus próprios comentários"
ON public.post_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Função para atualizar contador de curtidas
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger para atualizar contador de curtidas
CREATE TRIGGER update_post_likes_count_trigger
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_likes_count();

-- Função para atualizar contador de comentários
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger para atualizar contador de comentários
CREATE TRIGGER update_post_comments_count_trigger
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_post_comments_count();

-- Trigger para atualizar updated_at em posts
CREATE TRIGGER update_community_posts_updated_at
BEFORE UPDATE ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at em comentários
CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar storage bucket para mídia da comunidade
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-media',
  'community-media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
);

-- RLS policies para storage bucket community-media
CREATE POLICY "Imagens da comunidade são públicas"
ON storage.objects
FOR SELECT
USING (bucket_id = 'community-media');

CREATE POLICY "Usuárias autenticadas podem fazer upload"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'community-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuárias podem atualizar seus próprios arquivos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuárias podem deletar seus próprios arquivos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]);