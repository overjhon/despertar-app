-- Corrigir pending_purchases para referenciar o ID correto do ebook
UPDATE pending_purchases
SET ebook_id = '308cf18e-2ea8-4241-adc2-da8582bec253'
WHERE ebook_id = '346f79a0-9139-4ab2-b00b-06003194cb09'
  AND claimed = false;

-- Deletar o ebook duplicado antigo
DELETE FROM ebooks 
WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';