-- Function to remove a single file from a smart folder
CREATE OR REPLACE FUNCTION remove_file_from_smart_folder(p_folder_id UUID, p_file_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM smart_folder_items
  WHERE folder_id = p_folder_id AND file_id = p_file_id;
END;
$$;

-- Function to delete an entire smart folder
CREATE OR REPLACE FUNCTION delete_smart_folder(p_folder_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM smart_folders
  WHERE id = p_folder_id;
END;
$$;
