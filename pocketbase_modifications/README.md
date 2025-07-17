# AI File Explorer - PocketBase Extensions

✅ **BUILD STATUS: SUCCESSFUL** - The project now builds and runs successfully!

This project extends PocketBase with AI-powered file exploration capabilities using vector embeddings and semantic search.

## Current Status

- ✅ **Builds successfully** on macOS, Windows, and Linux
- ✅ **PocketBase integration** working with dbx.Builder interface
- ✅ **MCP server** running on port 8081
- ✅ **Service architecture** implemented with simplified mock services
- ⏳ **SQLite extensions** (sqlite-vec, sqlite-rembed) - ready for integration
- ⏳ **OpenAI API integration** - ready for implementation

## Features

- **File Crawling**: Directory scanning and file indexing (ready to implement)
- **Vector Embeddings**: OpenAI embeddings via sqlite-rembed (mock implementation)
- **Semantic Search**: Vector similarity search with sqlite-vec (mock implementation)
- **MCP Integration**: Model Context Protocol server (basic implementation)
- **PocketBase Backend**: Full database and API functionality

## Quick Start

### Prerequisites

- Go 1.21+ installed
- OpenAI API key (optional for current build)

### 1. Download or Build

**Option A: Use Pre-built Binaries**
- Download the appropriate binary for your platform from the releases
- `ai-file-explorer-windows.exe` (Windows)
- `ai-file-explorer-macos-intel` (macOS Intel)
- `ai-file-explorer-macos-arm64` (macOS Apple Silicon)

**Option B: Build from Source**
```bash
# Clone and build
git clone <repository-url>
cd pocketbase_modifications
go mod download

# Build for current platform
go build -o ai-file-explorer .

# Or use the build script for all platforms
./build.sh
```

### 2. Run the Application

```bash
# macOS/Linux
./ai-file-explorer serve

# Windows
ai-file-explorer-windows.exe serve
```

### 3. Access the Application

- **PocketBase Dashboard**: http://127.0.0.1:8090/_/
- **REST API**: http://127.0.0.1:8090/api/
- **MCP Server**: Running on port 8081

### 4. Optional: Set Environment Variables

```bash
export OPENAI_API_KEY="your-openai-api-key"  # For future OpenAI integration
export MCP_PORT="8081"  # Optional, defaults to 8081
```

## API Endpoints

### File Operations

- `POST /api/crawl` - Crawl a directory
- `POST /api/embed` - Generate embeddings for a file
- `POST /api/search` - Semantic search
- `POST /api/organize` - Organize files (planned)

### Example Usage

#### Crawl Directory
```bash
curl -X POST http://localhost:8090/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"path": "/path/to/directory"}'
```

#### Generate Embeddings
```bash
curl -X POST http://localhost:8090/api/embed \
  -H "Content-Type: application/json" \
  -d '{"file_id": "file_abc123"}'
```

#### Semantic Search
```bash
curl -X POST http://localhost:8090/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "machine learning algorithms", "limit": 10}'
```

## MCP Integration

The MCP server provides tools for AI assistants:

- `crawl_directory` - Crawl and index files
- `embed_files` - Generate embeddings
- `semantic_search` - Search using vector similarity
- `organize_files` - Organize files (planned)
- `get_file_info` - Get file metadata
- `find_similar_files` - Find similar files

### MCP Client Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "pocketbase-ai-explorer": {
      "command": "curl",
      "args": ["-X", "POST", "http://localhost:8081/mcp"],
      "env": {}
    }
  }
}
```

## Database Schema

The application creates the following collections:

### Files Collection
- `path` (text, required) - File path
- `name` (text) - File name
- `size` (number) - File size in bytes
- `content_type` (text) - MIME type
- `content` (text) - File content (for text files)
- `embedding` (text) - JSON array of embedding vector
- `tags` (text) - JSON array of tags

### Vector Table
- `file_vectors` - Virtual table using sqlite-vec for efficient similarity search

## Development

### Project Structure

```
pocketbase_modifications/
├── main.go                 # Main application entry point
├── go.mod                  # Go module definition
├── internal/
│   ├── crawler/           # File crawling service
│   │   └── service.go
│   ├── embeddings/        # Embedding generation service
│   │   ├── service.go
│   │   └── adapter.go
│   ├── search/           # Search service
│   │   └── service.go
│   ├── mcp/              # MCP server implementation
│   │   └── server.go
│   └── sqlite_driver/    # Custom SQLite driver
│       └── driver.go
├── extensions/           # SQLite extensions
│   └── rembed.so        # sqlite-rembed shared library
└── README.md
```

### Adding New Features

1. **New API Endpoints**: Add routes in `setupRoutes()` function in `main.go`
2. **New MCP Tools**: Add tools in `handleToolsList()` and implement in `executeTool()` in `mcp/server.go`
3. **New File Types**: Update `allowedTypes` in `crawler/service.go`
4. **Custom Embeddings**: Modify `generateEmbedding()` in `embeddings/service.go`

## Troubleshooting

### Common Issues

1. **sqlite-rembed not found**: Ensure `rembed.so` is in the `extensions/` directory
2. **OpenAI API errors**: Check your API key and quota
3. **Permission errors**: Ensure the application has read access to directories being crawled
4. **Memory issues**: Large files may cause memory problems; adjust `maxFileSize` in crawler

### Logs

The application logs important events:
- File crawling progress
- Embedding generation status
- Search operations
- MCP server requests

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Roadmap

- [ ] Gemini MCP integration for file organization
- [ ] Real-time file watching and auto-indexing
- [ ] Advanced search filters and facets
- [ ] File content preview and thumbnails
- [ ] Batch operations UI
- [ ] Performance optimizations
- [ ] Docker containerization
- [ ] Kubernetes deployment manifests
