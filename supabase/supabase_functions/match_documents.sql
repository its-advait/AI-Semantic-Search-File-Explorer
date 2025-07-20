CREATE OR REPLACE FUNCTION match_documents (
  query_embedding VECTOR(2048), -- Jina embeddings are 2048 dimensions
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id BIGINT,
  filepath TEXT,
  filename TEXT,
  date_created TIMESTAMP WITH TIME ZONE,
  date_modified TIMESTAMP WITH TIME ZONE,
  similarity FLOAT
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
    documents.date_modified,
    1 - (documents.embedding <=> query_embedding) AS similarity -- Cosine similarity calculation
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;