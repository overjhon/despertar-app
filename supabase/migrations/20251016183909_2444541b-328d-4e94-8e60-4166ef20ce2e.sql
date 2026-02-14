-- Add RLS policies for admins to manage ebooks
CREATE POLICY "Admins can insert ebooks"
ON public.ebooks
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ebooks"
ON public.ebooks
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ebooks"
ON public.ebooks
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));