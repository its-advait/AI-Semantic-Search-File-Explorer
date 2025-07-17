import os
from docx import Document
from pypdf import PdfReader
import datetime
from unstructured.partition.auto import partition
from supabase import create_client, Client
from sentence_transformers import SentenceTransformer
import config

# Initialize Supabase client
supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)

# Initialize Sentence Transformer model
model = SentenceTransformer('all-MiniLM-L6-v2')

def list_text_files(directory):
    text_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            filepath = os.path.join(root, file)
            # Check file extension first
            if not file.lower().endswith(('.txt', '.pdf', '.docx', '.doc')):
                continue # Skip files that are not target document types

            # Check file size (25MB limit)
            try:
                file_size = os.path.getsize(filepath)
                if file_size > (25 * 1024 * 1024): # 25 MB in bytes
                    print(f"Skipping large file (>{25}MB): {filepath}")
                    continue
            except OSError as e:
                print(f"Error getting size of {filepath}: {e}")
                continue # Skip if unable to get file size

            text_files.append(filepath)
    return text_files

def extract_text_from_file(file_path):
    text = ""
    try:
        if file_path.endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
        elif file_path.endswith('.pdf'):
            with open(file_path, 'rb') as f:
                reader = PdfReader(f)
                for page in reader.pages:
                    text += page.extract_text() or ""
        elif file_path.endswith('.docx'):
            document = Document(file_path)
            for paragraph in document.paragraphs:
                text += paragraph.text + "\n"
        elif file_path.endswith('.doc'):
            elements = partition(filename=file_path)
            for element in elements:
                text += str(element) + "\n"
        else:
            print(f"Unsupported file type for text extraction: {file_path}")
    except Exception as e:
        print(f"Error extracting text from {file_path}: {e}")
    return text

def create_documents_table():
    # This function is illustrative. In a real scenario, you'd typically manage
    # your database schema with migrations, not create tables from application code.
    # Ensure pgvector extension is enabled in your Supabase project.
    try:
        # Check if table exists (a simple way, but better to query information_schema)
        # This is a simplified check and might not be robust for all cases.
        # A direct 'CREATE TABLE IF NOT EXISTS' is often handled by Supabase migrations.
        # For demonstration, we'll try to insert and catch if table doesn't exist.
        print("Attempting to create 'documents' table if it does not exist...")
        # This SQL assumes you have the pgvector extension enabled.
        # The 'vector' type requires the extension.
        # You would run this SQL directly in your Supabase SQL editor or via migrations.
        # For programmatic creation, you'd use `execute` if available or a raw SQL query.
        # Supabase client doesn't directly expose a 'create table' method in this way.
        # So, this part is conceptual for what needs to be done on the DB side.
        print("Please ensure you have a 'documents' table with 'content' TEXT and 'embedding' VECTOR columns in Supabase.")
        print("Example SQL: CREATE TABLE documents (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), content TEXT, filepath TEXT, embedding VECTOR(384));")
    except Exception as e:
        print(f"Error ensuring 'documents' table exists: {e}")

def embed_and_upload(filepath, content):
    try:
        embedding = model.encode(content).tolist()
        filename = os.path.basename(filepath)
        date_created_ts = os.path.getctime(filepath)
        date_modified_ts = os.path.getmtime(filepath)
        date_created = datetime.datetime.fromtimestamp(date_created_ts).isoformat()
        date_modified = datetime.datetime.fromtimestamp(date_modified_ts).isoformat()
        response = supabase.table('documents').insert({'filepath': filepath, 'filename': filename, 'date_created': date_created, 'date_modified': date_modified, 'embedding': embedding}).execute()
        data = response.data
        count = response.count
        print(f"Stored metadata and embedding for {filepath} in Supabase.")
    except Exception as e:
        print(f"Error uploading {filepath} to Supabase: {e}")

if __name__ == "__main__":
    create_documents_table()
    target_directory = r"C:\Users\samcr\Downloads"
    files = list_text_files(target_directory)
    
    if not files:
        print(f"No text files found in {target_directory}")

    for file in files:
        print(f"--- Starting processing for: {file} ---")
        extracted_text = extract_text_from_file(file)
        if extracted_text:
            print(f"Text extracted successfully from {file}. Length: {len(extracted_text)} characters.")
            embed_and_upload(file, extracted_text)
        else:
            print(f"No text extracted from {file}. Skipping embedding.")
        print(f"--- Finished processing for: {file} ---")
    print("\n--- All files processed. ---")