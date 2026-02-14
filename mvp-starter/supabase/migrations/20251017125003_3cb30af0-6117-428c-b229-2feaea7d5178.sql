-- Create product mappings table
CREATE TABLE product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT UNIQUE NOT NULL,
  ebook_id UUID REFERENCES ebooks(id) NOT NULL,
  platform TEXT NOT NULL DEFAULT 'kiwify',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert the 4 correct mappings
INSERT INTO product_mappings (product_id, ebook_id, platform) VALUES
  ('625e5f79-ad1f-49b0-abf0-43cca3864c6e', '3fa85f64-5717-4562-b3fc-2c963f66afa6', 'kiwify'),
  ('3b1e4cf5-414e-4ff1-834a-8efaa0d24c94', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'kiwify'),
  ('346f79a0-9139-4ab2-b00b-06003194cb09', '308cf18e-2ea8-4241-adc2-da8582bec253', 'kiwify'),
  ('1e60fbaa-aa23-4c31-9457-07da1118d002', '7c9e6679-7425-40de-944b-e07fc1f90ae7', 'kiwify');

-- Enable RLS
ALTER TABLE product_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view product mappings"
ON product_mappings FOR SELECT
TO public
USING (true);

CREATE POLICY "Service can manage product mappings"
ON product_mappings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Fix existing pending purchases with correct ebook_id
UPDATE pending_purchases pp
SET ebook_id = pm.ebook_id
FROM product_mappings pm
WHERE pp.ebook_id::text = pm.product_id AND pp.claimed = false;