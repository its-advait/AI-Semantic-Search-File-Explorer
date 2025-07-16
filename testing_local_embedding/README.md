
# Local Filesystem Embedding Test

This project is a proof-of-concept script to test the core logic of an AI-powered file explorer. It demonstrates how to:
1.  Scan and watch local filesystem directories (e.g., Desktop, Documents).
2.  Generate vector embeddings for text files locally using a sentence-transformer model.
3.  Store those embeddings in a local Qdrant vector database.
4.  Architect the code in a way that simulates a Managed Component Protocol (MCP) setup, with a clear separation between the "Filesystem Crawler" and the "Embedding Service".

## How it Works

The system is composed of two main logical components orchestrated by `main.py`:

-   **`filesystem_crawler.py`**: This acts as the "Filesystem MCP Server". It performs an initial scan of the directories specified in `config.py`. After the scan, it uses `watchdog` to monitor for any newly created or modified files in real-time. When a file event occurs, it reads the file's content and passes it to the Embedding Service.

-   **`embedding_service.py`**: This acts as the "Qdrant & Embedding MCP Server". It receives file data, chunks the text content, and uses the `sentence-transformers` library to generate vector embeddings for each chunk. It then connects to the local Qdrant instance and upserts the embeddings along with metadata (like the file path and chunk text) into a persistent collection.

## Setup

1.  **Install Python:** Make sure you have Python 3.8 or newer installed.

2.  **Start Qdrant:** You need a running Qdrant instance. The easiest way is with Docker:
    ```bash
    docker run -p 6333:6333 -p 6334:6334 \
        -v $(pwd)/qdrant_data:/qdrant/storage \
        qdrant/qdrant
    ```
    This will also make your data persist between container restarts.

3.  **Install Python Dependencies:** Navigate to this directory in your terminal and run:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Directories:** Open `config.py` and edit the `DIRECTORIES_TO_WATCH` list to include the absolute paths to the folders you want to index on your machine.

## How to Run

Once the setup is complete, simply run the main script from this directory:

```bash
python main.py
```

The script will first perform the initial scan, which may take some time depending on the number of files. You will see log output in your terminal as it processes files. After the scan, it will switch to real-time watching mode.

You can stop the script at any time by pressing `Ctrl+C`.

```