-- Aumentar limites de tamanho dos buckets de storage
UPDATE storage.buckets
SET file_size_limit = 104857600 -- 100 MB em bytes
WHERE id = 'ebooks';

UPDATE storage.buckets
SET file_size_limit = 20971520 -- 20 MB em bytes
WHERE id = 'covers';

UPDATE storage.buckets
SET file_size_limit = 52428800 -- 50 MB em bytes
WHERE id = 'samples';