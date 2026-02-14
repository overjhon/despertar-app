-- Create users profile table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  whatsapp VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  onboarding_completed BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create ebooks table
CREATE TABLE IF NOT EXISTS public.ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  description TEXT,
  author VARCHAR(255),
  cover_url TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  total_pages INT NOT NULL,
  estimated_reading_time INT,
  category VARCHAR(100),
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;

-- RLS Policy - all authenticated users can read ebooks
CREATE POLICY "Authenticated users can view active ebooks"
  ON public.ebooks FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create user_ebooks (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.user_ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ebook_id UUID REFERENCES public.ebooks(id) ON DELETE CASCADE NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ebook_id)
);

-- Enable RLS
ALTER TABLE public.user_ebooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_ebooks
CREATE POLICY "Users can view own ebooks"
  ON public.user_ebooks FOR SELECT
  USING (auth.uid() = user_id);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ebook_id UUID REFERENCES public.ebooks(id) ON DELETE CASCADE NOT NULL,
  current_page INT DEFAULT 1,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  reading_time_minutes INT DEFAULT 0,
  UNIQUE(user_id, ebook_id)
);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_progress
CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Create chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id UUID REFERENCES public.ebooks(id) ON DELETE CASCADE NOT NULL,
  chapter_number INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  start_page INT NOT NULL,
  end_page INT NOT NULL,
  UNIQUE(ebook_id, chapter_number)
);

-- Enable RLS
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Authenticated users can view chapters"
  ON public.chapters FOR SELECT
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for ebooks
CREATE TRIGGER update_ebooks_updated_at
  BEFORE UPDATE ON public.ebooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();