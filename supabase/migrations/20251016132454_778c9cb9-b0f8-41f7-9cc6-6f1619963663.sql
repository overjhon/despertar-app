-- Add sample_pdf_url column to ebooks table
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS sample_pdf_url TEXT;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('ebooks', 'ebooks', false, 52428800, ARRAY['application/pdf']),
  ('covers', 'covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('samples', 'samples', true, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policy for ebooks bucket: only users who purchased can download
CREATE POLICY "Users can download purchased ebooks"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ebooks' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_ebooks ue
    WHERE ue.user_id = auth.uid()
    AND ue.ebook_id::text = (storage.foldername(name))[1]
  )
);

-- RLS Policy for covers bucket: public read
CREATE POLICY "Public can view covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

-- RLS Policy for samples bucket: public read
CREATE POLICY "Public can view samples"
ON storage.objects FOR SELECT
USING (bucket_id = 'samples');

-- Insert ebooks data
INSERT INTO public.ebooks (id, title, subtitle, description, author, category, cover_url, pdf_url, sample_pdf_url, total_pages, estimated_reading_time, tags, is_active)
VALUES 
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    '50 Receitas Exclusivas de Velas Gourmet',
    'Transforme sua casa em uma fábrica de aromas irresistíveis',
    'Descubra 50 receitas únicas e testadas de velas gourmet que encantam pelo aroma e visual. Aprenda técnicas profissionais de aromatização, coloração e acabamento para criar velas que se destacam no mercado.',
    'Equipe Velas Artesanais',
    'Receitas',
    'covers/50-receitas-cover.jpg',
    'ebooks/f47ac10b-58cc-4372-a567-0e02b2c3d479/50-Receitas-Exclusivas-de-Velas-Gourmet.pdf',
    'samples/50-receitas-sample.pdf',
    32,
    45,
    ARRAY['velas', 'receitas', 'gourmet', 'aromatização', 'artesanato'],
    true
  ),
  (
    '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    'Velas que Vendem',
    'Estratégias comprovadas para transformar sua produção em lucro',
    'O guia completo para quem quer vender velas com sucesso. Aprenda precificação estratégica, posicionamento de mercado, técnicas de vendas online e offline, e como criar uma marca que os clientes amam.',
    'Equipe Velas Artesanais',
    'Negócios',
    'covers/velas-que-vendem-cover.jpg',
    'ebooks/7c9e6679-7425-40de-944b-e07fc1f90ae7/Velas-que-Vendem.pdf',
    'samples/velas-que-vendem-sample.pdf',
    45,
    60,
    ARRAY['velas', 'vendas', 'marketing', 'precificação', 'negócio'],
    true
  ),
  (
    '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    'Velas Terapêuticas',
    'A Linha Funcional Que Fatura 3x Mais',
    'Descubra o mercado em expansão das velas terapêuticas. Aprenda a criar velas com propriedades relaxantes, energizantes e terapêuticas usando óleos essenciais, cristais e técnicas de aromaterapia. Um nicho lucrativo e em alta.',
    'Equipe Velas Artesanais',
    'Terapêutico',
    'covers/velas-terapeuticas-cover.jpg',
    'ebooks/3fa85f64-5717-4562-b3fc-2c963f66afa6/Velas-Terapeuticas-A-Linha-Funcional-Que-Fatura-3x-Mais.pdf',
    'samples/velas-terapeuticas-sample.pdf',
    38,
    50,
    ARRAY['velas', 'terapêuticas', 'aromaterapia', 'óleos essenciais', 'cristais'],
    true
  ),
  (
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    'Velas Sazonais',
    'Lucre com as datas comemorativas e estações do ano',
    'Aprenda a criar coleções sazonais que explodem em vendas. Descubra técnicas exclusivas para velas de Natal, Páscoa, Dia das Mães, festas juninas e muito mais. Planeje seu calendário anual de lançamentos e maximize seus lucros.',
    'Equipe Velas Artesanais',
    'Sazonais',
    'covers/velas-sazonais-cover.jpg',
    'ebooks/6ba7b810-9dad-11d1-80b4-00c04fd430c8/Velas_Sazonais_compressed.pdf',
    'samples/velas-sazonais-sample.pdf',
    28,
    40,
    ARRAY['velas', 'sazonais', 'datas comemorativas', 'coleções', 'vendas'],
    true
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  author = EXCLUDED.author,
  category = EXCLUDED.category,
  cover_url = EXCLUDED.cover_url,
  pdf_url = EXCLUDED.pdf_url,
  sample_pdf_url = EXCLUDED.sample_pdf_url,
  total_pages = EXCLUDED.total_pages,
  estimated_reading_time = EXCLUDED.estimated_reading_time,
  tags = EXCLUDED.tags,
  is_active = EXCLUDED.is_active;