-- Permitir admins visualizarem todos os ebooks (ativos e inativos)
CREATE POLICY "Admins can view all ebooks"
ON public.ebooks
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));