
import os
import logging
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import config
from embedding_service import EmbeddingService

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - [FileSystemCrawler] - %(message)s')

class FileChangeHandler(FileSystemEventHandler):
    """Handles events from the filesystem watcher."""
    def __init__(self, embedding_service: EmbeddingService):
        self.embedding_service = embedding_service

    def on_created(self, event):
        if not event.is_directory:
            logging.info(f"File created: {event.src_path}")
            process_file(event.src_path, self.embedding_service)

    def on_modified(self, event):
        if not event.is_directory:
            logging.info(f"File modified: {event.src_path}")
            process_file(event.src_path, self.embedding_service)

def is_valid_file(file_path: str) -> bool:
    """Checks if a file should be processed based on config rules."""
    # Check extension
    _, ext = os.path.splitext(file_path)
    if ext.lower() in config.EXCLUDED_EXTENSIONS:
        logging.debug(f"Skipping {file_path} due to excluded extension.")
        return False
    
    # Check file size
    try:
        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        if file_size_mb > config.MAX_FILE_SIZE_MB:
            logging.warning(f"Skipping {file_path}, size {file_size_mb:.2f}MB exceeds max of {config.MAX_FILE_SIZE_MB}MB.")
            return False
    except OSError:
        return False # File might have been deleted between check and processing

    return True

def process_file(file_path: str, embedding_service: EmbeddingService):
    """Reads a file and passes its content to the embedding service."""
    if not is_valid_file(file_path):
        return
    
    try:
        # We try to read as text. For a full app, you'd add handlers for .pdf, .docx, etc.
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        embedding_service.embed_and_store_document(file_path, content)

    except Exception as e:
        logging.error(f"Failed to process file {file_path}: {e}")


class FilesystemCrawler:
    """
    Scans initial directories and then watches for changes.
    This simulates the "Filesystem MCP Server".
    """
    def __init__(self, embedding_service: EmbeddingService):
        self.embedding_service = embedding_service
        self.observer = Observer()

    def initial_scan(self):
        """Performs a one-time scan of all directories on startup."""
        logging.info("Starting initial scan of all configured directories...")
        for directory in config.DIRECTORIES_TO_WATCH:
            logging.info(f"Scanning {directory}...")
            for root, _, files in os.walk(directory):
                for name in files:
                    file_path = os.path.join(root, name)
                    process_file(file_path, self.embedding_service)
        logging.info("Initial scan complete.")

    def start_watching(self):
        """Starts the real-time filesystem watcher."""
        event_handler = FileChangeHandler(self.embedding_service)
        for directory in config.DIRECTORIES_TO_WATCH:
            if os.path.exists(directory):
                self.observer.schedule(event_handler, directory, recursive=True)
                logging.info(f"Now watching for changes in {directory}")
            else:
                logging.error(f"Directory not found, cannot watch: {directory}")
        
        self.observer.start()
        logging.info("Filesystem watcher started. Press Ctrl+C to stop.")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            self.observer.stop()
        self.observer.join()
