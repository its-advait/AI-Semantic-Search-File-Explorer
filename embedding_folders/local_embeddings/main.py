
import logging
from embedding_service import EmbeddingService
from filesystem_crawler import FilesystemCrawler

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - [Main] - %(message)s')

def main():
    """
    Main entry point for the script.
    Orchestrates the setup and startup of the services.
    """
    logging.info("--- Starting Local Embedding Test ---")

    # 1. Initialize the service that handles embeddings and Qdrant.
    #    This loads the ML model into memory.
    embedding_service = EmbeddingService()

    # 2. Ensure the Qdrant collection is ready.
    embedding_service.setup_collection()

    # 3. Initialize the filesystem crawler.
    crawler = FilesystemCrawler(embedding_service)

    # 4. Perform the initial scan to index all existing files.
    crawler.initial_scan()

    # 5. Start the real-time watcher to handle new/modified files.
    #    This will run forever until you stop the script with Ctrl+C.
    crawler.start_watching()

    logging.info("--- Script finished ---")

if __name__ == "__main__":
    main()
