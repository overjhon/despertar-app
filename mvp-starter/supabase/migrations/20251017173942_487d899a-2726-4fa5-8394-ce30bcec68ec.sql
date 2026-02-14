-- Mídia em Depoimentos
CREATE TABLE IF NOT EXISTS testimonial_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE testimonial_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view testimonial media"
ON testimonial_media FOR SELECT
USING (true);

CREATE POLICY "Users can insert media to own testimonials"
ON testimonial_media FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM testimonials 
    WHERE id = testimonial_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own testimonial media"
ON testimonial_media FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM testimonials 
    WHERE id = testimonial_id AND user_id = auth.uid()
  )
);

-- Galeria de Criações
CREATE TABLE IF NOT EXISTS community_creations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  ebook_id UUID REFERENCES ebooks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  ingredients JSONB,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  likes_count INTEGER DEFAULT 0 NOT NULL,
  saves_count INTEGER DEFAULT 0 NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE community_creations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public creations"
ON community_creations FOR SELECT
USING (true);

CREATE POLICY "Users can insert own creations"
ON community_creations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own creations"
ON community_creations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own creations"
ON community_creations FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all creations"
ON community_creations FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS creation_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creation_id UUID REFERENCES community_creations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(creation_id, user_id)
);

ALTER TABLE creation_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view creation likes"
ON creation_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like creations"
ON creation_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike creations"
ON creation_likes FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar likes_count em community_creations
CREATE OR REPLACE FUNCTION update_creation_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_creations
    SET likes_count = likes_count + 1
    WHERE id = NEW.creation_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_creations
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.creation_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER creation_likes_count_trigger
AFTER INSERT OR DELETE ON creation_likes
FOR EACH ROW EXECUTE FUNCTION update_creation_likes_count();

-- Q&A System
CREATE TABLE IF NOT EXISTS ebook_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  is_answered BOOLEAN DEFAULT FALSE NOT NULL,
  helpful_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE ebook_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions"
ON ebook_questions FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can ask questions"
ON ebook_questions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questions"
ON ebook_questions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own questions"
ON ebook_questions FOR DELETE
USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES ebook_questions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  answer TEXT NOT NULL,
  is_verified_purchaser BOOLEAN DEFAULT FALSE NOT NULL,
  is_official BOOLEAN DEFAULT FALSE NOT NULL,
  helpful_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view answers"
ON question_answers FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can answer questions"
ON question_answers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
ON question_answers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own answers"
ON question_answers FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all answers"
ON question_answers FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Trigger para marcar pergunta como respondida
CREATE OR REPLACE FUNCTION mark_question_answered()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ebook_questions
  SET is_answered = true
  WHERE id = NEW.question_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER question_answered_trigger
AFTER INSERT ON question_answers
FOR EACH ROW EXECUTE FUNCTION mark_question_answered();

-- Live Activity Tracking
CREATE TABLE IF NOT EXISTS live_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('viewing', 'purchased', 'completed', 'reading')),
  user_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE live_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live activity"
ON live_activity FOR SELECT
USING (true);

CREATE POLICY "System can insert live activity"
ON live_activity FOR INSERT
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_community_creations_updated_at
BEFORE UPDATE ON community_creations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();