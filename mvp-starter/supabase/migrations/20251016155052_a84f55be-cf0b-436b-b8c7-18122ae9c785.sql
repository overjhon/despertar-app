-- Create testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ebook_id uuid NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title character varying NOT NULL,
  content text NOT NULL,
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, ebook_id)
);

-- Create testimonial_likes table
CREATE TABLE IF NOT EXISTS public.testimonial_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  testimonial_id uuid NOT NULL REFERENCES public.testimonials(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(testimonial_id, user_id)
);

-- Create testimonial_comments table
CREATE TABLE IF NOT EXISTS public.testimonial_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  testimonial_id uuid NOT NULL REFERENCES public.testimonials(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_follows table
CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonial_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonial_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for testimonials
CREATE POLICY "Public testimonials are viewable by everyone"
  ON public.testimonials FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert own testimonials"
  ON public.testimonials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own testimonials"
  ON public.testimonials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own testimonials"
  ON public.testimonials FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for testimonial_likes
CREATE POLICY "Anyone can view likes"
  ON public.testimonial_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON public.testimonial_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.testimonial_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for testimonial_comments
CREATE POLICY "Anyone can view comments"
  ON public.testimonial_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON public.testimonial_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.testimonial_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.testimonial_comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_follows
CREATE POLICY "Anyone can view follows"
  ON public.user_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own follows"
  ON public.user_follows FOR ALL
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

-- Triggers for updated_at
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_testimonial_comments_updated_at
  BEFORE UPDATE ON public.testimonial_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update likes count
CREATE OR REPLACE FUNCTION public.update_testimonial_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.testimonials
    SET likes_count = likes_count + 1
    WHERE id = NEW.testimonial_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.testimonials
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.testimonial_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Function to update comments count
CREATE OR REPLACE FUNCTION public.update_testimonial_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.testimonials
    SET comments_count = comments_count + 1
    WHERE id = NEW.testimonial_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.testimonials
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.testimonial_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Triggers for counts
CREATE TRIGGER testimonial_likes_count_trigger
  AFTER INSERT OR DELETE ON public.testimonial_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_testimonial_likes_count();

CREATE TRIGGER testimonial_comments_count_trigger
  AFTER INSERT OR DELETE ON public.testimonial_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_testimonial_comments_count();