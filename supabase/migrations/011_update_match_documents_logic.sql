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
)
LANGUAGE plpgsql
AS $$
DECLARE
  match_count_check INT;
BEGIN
  -- First, check how many documents meet the threshold
  SELECT count(*)
  INTO match_count_check
  FROM documents
  WHERE 
    documents.user_identifier = p_user_identifier AND
    1 - (documents.embedding <=> query_embedding) > match_threshold;

  -- If the count is 3 or more, return the results that meet the threshold
  IF match_count_check >= 3 THEN
    RETURN QUERY
    SELECT
      d.id_bigint,
      d.filepath,
      d.filename,
      d.date_created,
      d.date_modified
    FROM documents d
    WHERE 
      d.user_identifier = p_user_identifier AND
      1 - (d.embedding <=> query_embedding) > match_threshold
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
  -- Otherwise, return the top 3 most similar documents regardless of the threshold
  ELSE
    RETURN QUERY
    SELECT
      d.id_bigint,
      d.filepath,
      d.filename,
      d.date_created,
      d.date_modified
    FROM documents d
    WHERE d.user_identifier = p_user_identifier
    ORDER BY d.embedding <=> query_embedding
    LIMIT 3;
  END IF;
END;
$$;
