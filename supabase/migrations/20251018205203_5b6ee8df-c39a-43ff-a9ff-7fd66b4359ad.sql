-- Fix product_mappings RLS policy to prevent enumeration
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can read product mappings" ON product_mappings;

-- Create admin-only read policy
CREATE POLICY "Only admins can read product mappings"
ON product_mappings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create secure function for edge functions to lookup mappings
CREATE OR REPLACE FUNCTION get_ebook_id_for_product(p_product_id text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ebook_id 
  FROM product_mappings 
  WHERE product_id = p_product_id 
  AND platform = 'kiwify'
  LIMIT 1;
$$;