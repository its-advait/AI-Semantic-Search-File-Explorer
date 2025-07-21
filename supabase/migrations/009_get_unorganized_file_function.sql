CREATE OR REPLACE FUNCTION get_unorganized_file(p_user_identifier TEXT)
RETURNS TABLE (
  id UUID,
  embedding VECTOR(2048),
  filepath TEXT,
  id_bigint BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.embedding,
    d.filepath,
    d.id_bigint
  FROM documents d
  LEFT JOIN smart_folder_items sfi ON d.id_bigint = sfi.file_id
  WHERE sfi.folder_id IS NULL AND d.user_identifier = p_user_identifier
  ORDER BY random() -- Get a random one each time
  LIMIT 1;
END;
$$;
