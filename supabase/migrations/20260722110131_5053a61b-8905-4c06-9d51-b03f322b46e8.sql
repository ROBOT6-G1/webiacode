
-- 1) Referrals: writes are backend-only via SECURITY DEFINER trigger public.handle_new_user.
--    Revoke direct client write privileges so RLS/absence-of-policy intent is explicit.
REVOKE INSERT, UPDATE, DELETE ON public.referrals FROM anon, authenticated;

-- 2) user_integrations: keep row-owner writes, but hide the sensitive secret columns
--    from client SELECT reads. Reads of sensitive tokens must go through server
--    functions using the service role. Users can still write (upsert) tokens.
REVOKE SELECT ON public.user_integrations FROM anon, authenticated;

GRANT SELECT (
  id,
  user_id,
  github_username,
  vercel_team_id,
  supabase_url,
  ai_provider,
  created_at,
  updated_at
) ON public.user_integrations TO authenticated;
