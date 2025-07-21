CREATE OR REPLACE FUNCTION get_smart_folder_files(p_folder_id UUID)
RETURNS TABLE (
  id BIGINT,
  filepath TEXT,
  filename TEXT,
  date_created TIMESTAMP WITH TIME ZONE,
  date_modified TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id_bigint,
    d.filepath,
    d.filename,
    d.date_created,
    d.date_modified
  FROM documents d
  JOIN smart_folder_items sfi ON d.id_bigint = sfi.file_id
  WHERE sfi.folder_id = p_folder_id;
END;
$$;
