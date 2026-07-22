DROP FUNCTION IF EXISTS private.exec_sql(TEXT);

CREATE OR REPLACE FUNCTION public.exec_sql(query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  BEGIN
    EXECUTE 'WITH q AS (' || query || ') SELECT COALESCE(jsonb_agg(row_to_json(q)), ''[]''::jsonb) FROM q' INTO result;
    RETURN result;
  EXCEPTION WHEN OTHERS THEN
    EXECUTE query;
    RETURN jsonb_build_object('status', 'ok');
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.exec_sql(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO service_role;