CREATE OR REPLACE FUNCTION private.exec_sql(query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE 'WITH q AS (' || query || ') SELECT COALESCE(jsonb_agg(row_to_json(q)), ''[]''::jsonb) FROM q' INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- If the statement is DDL / not a SELECT, just execute it and return status
  BEGIN
    EXECUTE query;
    RETURN jsonb_build_object('status', 'ok');
  EXCEPTION WHEN OTHERS THEN
    RAISE;
  END;
END;
$$;

REVOKE ALL ON FUNCTION private.exec_sql(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.exec_sql(TEXT) TO service_role;