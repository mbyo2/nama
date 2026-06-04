CREATE POLICY "Admins upload blog images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'blog-images'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
);

CREATE POLICY "Admins update blog images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'blog-images'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
);

CREATE POLICY "Admins delete blog images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'blog-images'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
);

CREATE POLICY "Anyone can read blog images"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'blog-images');