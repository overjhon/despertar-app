-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Service can manage product mappings" ON public.product_mappings;

-- Allow admins to manage product mappings
CREATE POLICY "Admins can manage product mappings"
ON public.product_mappings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));