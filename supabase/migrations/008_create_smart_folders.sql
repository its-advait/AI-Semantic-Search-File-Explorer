-- Step 1: Add a UNIQUE constraint to the documents.id_bigint column
ALTER TABLE public.documents ADD CONSTRAINT documents_id_bigint_unique UNIQUE (id_bigint);

-- Step 2: Create the smart_folders table
CREATE TABLE smart_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  user_identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create the smart_folder_items table, which can now reference the unique column
CREATE TABLE smart_folder_items (
  folder_id UUID REFERENCES smart_folders(id) ON DELETE CASCADE,
  file_id BIGINT REFERENCES documents(id_bigint) ON DELETE CASCADE,
  PRIMARY KEY (folder_id, file_id)
);

-- Step 4: Create the database function to handle the transaction
CREATE OR REPLACE FUNCTION create_smart_folder_and_link_files(
  p_folder_name TEXT,
  p_folder_description TEXT,
  p_user_identifier TEXT,
  p_file_ids BIGINT[]
)
RETURNS TABLE (id UUID, name TEXT, description TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  new_folder_id UUID;
BEGIN
  -- Create the new smart folder
  INSERT INTO smart_folders (name, description, user_identifier)
  VALUES (p_folder_name, p_folder_description, p_user_identifier)
  RETURNING smart_folders.id INTO new_folder_id;

  -- Link the files to the new folder
  IF array_length(p_file_ids, 1) > 0 THEN
    INSERT INTO smart_folder_items (folder_id, file_id)
    SELECT new_folder_id, unnest(p_file_ids);
  END IF;

  -- Return the newly created folder details
  RETURN QUERY
  SELECT sf.id, sf.name, sf.description FROM smart_folders sf WHERE sf.id = new_folder_id;
END;
$$;