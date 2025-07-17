# AI File Explorer Setup Guide

## Project Status

✅ **COMPLETED**: Full AI File Explorer implementation with PocketBase extensions

The project is now complete with all core components implemented:

### 🏗️ Architecture Components

1. **Custom SQLite Driver** (`internal/sqlite_driver/driver.go`)
   - Integrates sqlite-vec and sqlite-rembed extensions
   - Provides vector operations and cosine similarity

2. **File Crawler Service** (`internal/crawler/service.go`)
   - Recursively crawls directories
   - Filters files by type and size
   - Extracts content and metadata

3. **Embedding Service** (`internal/embeddings/service.go`)
   - Generates OpenAI embeddings via sqlite-rembed
   - Stores embeddings in PocketBase and vector table
   - Includes adapter for search service integration

4. **Search Service** (`internal/search/service.go`)
   - Semantic search using vector similarity
   - Text-based fallback search
   - Hybrid search capabilities

5. **MCP Server** (`internal/mcp/server.go`)
   - Model Context Protocol implementation
   - Exposes AI tools for file operations
   - HTTP-based MCP interface

6. **Main Application** (`main.go`)
   - PocketBase initialization with custom driver
   - Database schema setup
   - API route configuration
   - Service integration

### 📁 Project Structure

```
pocketbase_modifications/
├── main.go                    # Main application entry point
├── go.mod                     # Go dependencies
├── Makefile                   # Build and development commands
├── Dockerfile                 # Container configuration
├── docker-compose.yml         # Development environment
├── README.md                  # Comprehensive documentation
├── SETUP.md                   # This setup guide
├── test.sh                    # Test script
├── .air.toml                  # Live reload configuration
├── .gitignore                 # Git ignore rules
├── .dockerignore              # Docker ignore rules
├── internal/
│   ├── crawler/
│   │   └── service.go         # File crawling logic
│   ├── embeddings/
│   │   ├── service.go         # Embedding generation
│   │   └── adapter.go         # Search service adapter
│   ├── search/
│   │   └── service.go         # Semantic search
│   ├── mcp/
│   │   └── server.go          # MCP server implementation
│   └── sqlite_driver/
│       └── driver.go          # Custom SQLite driver
└── web/
    └── index.html             # Test web interface
```

### 🚀 Quick Start

1. **Install Go 1.21+**
   ```bash
   # macOS
   brew install go
   
   # Or download from https://golang.org/dl/
   ```

2. **Set Environment Variables**
   ```bash
   export OPENAI_API_KEY=OPENAI_API_KEY
   export MCP_PORT="8081"  # Optional
   ```

3. **Build sqlite-rembed Extension**
   ```bash
   make build-rembed
   # Or manually:
   # git clone https://github.com/asg017/sqlite-rembed
   # cd sqlite-rembed
   # make loadable-release  # Creates optimized loadable extension
   # mkdir -p ../bench/pocketbase_modifications/extensions
   # cp dist/release/rembed0.dylib ../bench/pocketbase_modifications/extensions/rembed.dylib  # macOS
   # cp dist/release/rembed0.so ../bench/pocketbase_modifications/extensions/rembed.so      # Linux
   ```

4. **Build and Run**
   ```bash
   make build
   make run
   # Or manually: /usr/local/go/bin/go build -o ai-file-explorer . && ./ai-file-explorer serve
   ```

5. **Test the API**
   ```bash
   ./test.sh
   # Or open http://localhost:8080 for web interface
   ```

### 🔧 Development Commands

```bash
# Build application
make build

# Run application
make run

# Development mode with auto-reload
make dev

# Run tests
make test

# Check environment setup
make check-env

# Build sqlite-rembed extension
make build-rembed

# Docker development
docker-compose up
```

### 🌐 API Endpoints

- `POST /api/crawl` - Crawl directory and index files
- `POST /api/embed` - Generate embeddings for a file
- `POST /api/search` - Semantic search with vector similarity
- `POST /api/organize` - File organization (planned)

### 🤖 MCP Integration

The MCP server runs on port 8081 and provides these tools:
- `crawl_directory` - Index files in a directory
- `embed_files` - Generate embeddings
- `semantic_search` - Vector similarity search
- `organize_files` - File organization (planned)
- `get_file_info` - Retrieve file metadata
- `find_similar_files` - Find similar files

### 🧪 Testing

1. **Web Interface**: Open `web/index.html` in browser
2. **Command Line**: Run `./test.sh` script
3. **API Testing**: Use curl or Postman with the endpoints
4. **MCP Testing**: Connect MCP client to `http://localhost:8081/mcp`

### 📋 Next Steps

1. **Install Go** if not already installed
2. **Set OpenAI API Key** for embedding functionality
3. **Build sqlite-rembed extension** (see README.md)
4. **Run the application** with `make run`
5. **Test functionality** with the web interface or test script

### 🔍 Key Features

- ✅ File crawling and indexing
- ✅ Vector embedding generation
- ✅ Semantic search with cosine similarity
- ✅ MCP server for AI integration
- ✅ REST API endpoints
- ✅ Web testing interface
- ✅ Docker support
- ✅ Development tools and scripts
- ⏳ Gemini MCP file organization (planned)

### 🐛 Troubleshooting

1. **Go not found**: Install Go from https://golang.org/dl/
2. **sqlite-rembed missing**: Run `make build-rembed`
3. **OpenAI API errors**: Check API key and quota
4. **Permission errors**: Ensure read access to directories
5. **Port conflicts**: Change ports in environment variables

The project is ready for development and testing! 🎉
