CREATE OR REPLACE FUNCTION match_documents (
  query_embedding VECTOR(2048),
  p_user_identifier TEXT,
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id BIGINT,
  filepath TEXT,
  filename TEXT,
  date_created TIMESTAMP WITH TIME ZONE,
  date_modified TIMESTAMP WITH TIME ZONE
  -- Removed similarity FLOAT from return
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id_bigint,
    documents.filepath,
    documents.filename,
    documents.date_created,
    documents.date_modified
    -- Removed similarity calculation from SELECT
  FROM documents
  WHERE 
    documents.user_identifier = p_user_identifier AND
    1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;