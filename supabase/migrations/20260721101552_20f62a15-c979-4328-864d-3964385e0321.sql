
CREATE POLICY "own payment proof upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own payment proof read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "own support image upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'support-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own support image read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'support-images' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
