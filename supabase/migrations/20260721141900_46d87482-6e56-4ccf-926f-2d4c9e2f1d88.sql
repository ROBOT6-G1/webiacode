CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(UUID, public.app_role) TO authenticated, service_role;

ALTER POLICY "admins read all profiles" ON public.profiles
  USING (private.has_role(auth.uid(), 'admin'));

ALTER POLICY "admins update all profiles" ON public.profiles
  USING (private.has_role(auth.uid(), 'admin'));

ALTER POLICY "admins read all roles" ON public.user_roles
  USING (private.has_role(auth.uid(), 'admin'));

ALTER POLICY "admin projects read" ON public.projects
  USING (private.has_role(auth.uid(), 'admin'));

ALTER POLICY "admin payments all" ON public.payments
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

ALTER POLICY "admin gemini keys" ON public.admin_gemini_keys
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

ALTER POLICY "admin tickets" ON public.support_tickets
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

ALTER POLICY "admin faqs write" ON public.faqs
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

ALTER POLICY "own payment proof read" ON storage.objects
  USING (bucket_id = 'payment-proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR private.has_role(auth.uid(), 'admin')));

ALTER POLICY "own support image read" ON storage.objects
  USING (bucket_id = 'support-images' AND ((storage.foldername(name))[1] = auth.uid()::text OR private.has_role(auth.uid(), 'admin')));

DROP FUNCTION public.has_role(UUID, public.app_role);