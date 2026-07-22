
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS files jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS github_repo text,
  ADD COLUMN IF NOT EXISTS vercel_url text,
  ADD COLUMN IF NOT EXISTS vercel_project_id text;

CREATE OR REPLACE FUNCTION public.add_credits(_user_id uuid, _amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_balance INTEGER;
BEGIN
  UPDATE public.profiles SET credits = credits + _amount
    WHERE id = _user_id
    RETURNING credits INTO new_balance;
  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;
  RETURN new_balance;
END; $$;
