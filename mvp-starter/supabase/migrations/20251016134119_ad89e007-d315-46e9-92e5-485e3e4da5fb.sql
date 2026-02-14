-- Política para ADMIN fazer upload no bucket 'ebooks'
CREATE POLICY "Admin can upload to ebooks"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ebooks'
);

-- Política para ADMIN fazer upload no bucket 'covers'
CREATE POLICY "Admin can upload to covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'covers'
);

-- Política para ADMIN fazer upload no bucket 'samples'
CREATE POLICY "Admin can upload to samples"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'samples'
);

-- Política para ADMIN atualizar arquivos
CREATE POLICY "Admin can update files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('ebooks', 'covers', 'samples')
)
WITH CHECK (
  bucket_id IN ('ebooks', 'covers', 'samples')
);

-- Política para ADMIN deletar arquivos
CREATE POLICY "Admin can delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('ebooks', 'covers', 'samples')
);