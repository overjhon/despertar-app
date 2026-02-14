-- Storage policies to allow admins to manage files in private 'ebooks' bucket

-- Allow admins to upload (INSERT) into ebooks bucket
CREATE POLICY "Admins can upload to ebooks bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ebooks'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update objects in ebooks bucket
CREATE POLICY "Admins can update ebooks bucket objects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ebooks' AND public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'ebooks' AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete objects in ebooks bucket
CREATE POLICY "Admins can delete ebooks bucket objects"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ebooks' AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Optional: allow admins to list/view objects in ebooks bucket
CREATE POLICY "Admins can view ebooks bucket objects"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ebooks' AND public.has_role(auth.uid(), 'admin'::app_role)
);
