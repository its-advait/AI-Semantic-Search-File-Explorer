import logging
import uuid
import hashlib
from qdrant_client import QdrantClient, models
from sentence_transformers import SentenceTransformer
import config

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - [EmbeddingService] - %(message)s')

class EmbeddingService:
    """
    Handles the embedding generation and storage into Qdrant.
    This simulates the "Qdrant MCP Server".
    """
    def __init__(self):
        logging.info("Initializing Embedding Service...")
        self.qdrant_client = QdrantClient(host=config.QDRANT_HOST, port=config.QDRANT_PORT)
        
        # The model is downloaded and loaded into memory only once for efficiency.
        logging.info(f"Loading sentence-transformer model: {config.EMBEDDING_MODEL}")
        self.embedding_model = SentenceTransformer(config.EMBEDDING_MODEL)
        logging.info("Model loaded successfully.")

    def setup_collection(self):
        """Ensures the Qdrant collection exists and is configured correctly."""
        try:
            collection_info = self.qdrant_client.get_collection(collection_name=config.COLLECTION_NAME)
            logging.info(f"Collection '{config.COLLECTION_NAME}' already exists.")
        except Exception:
            logging.info(f"Collection '{config.COLLECTION_NAME}' not found. Creating it now.")
            self.qdrant_client.recreate_collection(
                collection_name=config.COLLECTION_NAME,
                vectors_config=models.VectorParams(
                    size=config.EMBEDDING_DIMENSION,
                    distance=models.Distance.COSINE # Cosine similarity is good for text embeddings
                )
            )
            logging.info("Collection created.")

    def embed_and_store_document(self, file_path: str, content: str):
        """
        Chunks a document, creates embeddings for each chunk, and upserts them into Qdrant.
        """
        logging.info(f"Processing document: {file_path}")
        
        # 1. Chunk the document
        # A simple strategy is to split by double newlines, which often separate paragraphs.
        chunks = content.split('\n\n')
        chunks = [chunk.strip() for chunk in chunks if chunk.strip()]
        
        if not chunks:
            logging.warning(f"No content chunks found in {file_path}. Skipping.")
            return

        logging.info(f"Document split into {len(chunks)} chunk(s).")

        # 2. Embed each chunk
        embeddings = self.embedding_model.encode(chunks, show_progress_bar=False)

        # 3. Create Qdrant points
        points = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            # Create a deterministic UUID for the point ID to ensure it's valid.
            # This helps prevent 400 Bad Request errors from Qdrant.
            seed = f"{file_path}_{i}"
            hashed_seed = hashlib.sha256(seed.encode('utf-8')).digest()
            point_id = str(uuid.UUID(bytes=hashed_seed[:16]))

            points.append(models.PointStruct(
                id=point_id,
                vector=embedding.tolist(),
                payload={
                    "file_path": file_path,
                    "chunk_text": chunk,
                    "chunk_number": i + 1
                }
            ))
        
        # 4. Upsert points into Qdrant
        if points:
            self.qdrant_client.upsert(
                collection_name=config.COLLECTION_NAME,
                points=points,
                wait=True # Wait for the operation to complete
            )
            logging.info(f"Successfully upserted {len(points)} points for {file_path}")

