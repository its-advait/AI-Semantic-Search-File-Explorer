
# Configuration for the local embedding test script

# --- Qdrant Configuration ---
QDRANT_HOST = "localhost"
QDRANT_PORT = 6333
COLLECTION_NAME = "local_filesystem_test"

# --- Embedding Model Configuration ---
# We use a local sentence-transformer model to avoid API calls for this test.
# 'all-MiniLM-L6-v2' is a great, lightweight starting point.
# Vector size for this model is 384.
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
EMBEDDING_DIMENSION = 384

# --- Filesystem Configuration ---
# Add the absolute paths to the directories you want to watch.
# IMPORTANT: Use forward slashes "/" even on Windows.
DIRECTORIES_TO_WATCH = [
    "C:/Users/samcr/Desktop",
    "C:/Users/samcr/Documents",
    "C:/Users/samcr/Downloads"
]

# --- Filtering Configuration ---
# Ignore files with these extensions. Add any others you need.
EXCLUDED_EXTENSIONS = [
    # General Exclusions
    ".exe", ".dll", ".so", ".zip", ".rar", ".iso", ".img",
    ".log", ".tmp", ".swp", ".DS_Store",

    # Image Files
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".webp", ".svg",

    # Video Files
    ".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv",

    # Audio Files
    ".mp3", ".wav", ".ogg", ".flac", ".aac"
]

# Ignore files larger than this size in megabytes.
MAX_FILE_SIZE_MB = 25
