# Project Notes

## Overview
This markdown file contains project documentation and notes.

## Features
- File crawling and indexing
- Semantic search capabilities
- Vector embeddings using OpenAI
- SQLite extensions for vector operations

## Technical Stack
- **Backend**: PocketBase with Go
- **Database**: SQLite with sqlite-vec and sqlite-rembed extensions
- **AI**: OpenAI embeddings API
- **Search**: Vector similarity using cosine distance

## Implementation Details
The system crawls local files, extracts text content, generates embeddings, and stores them in a vector database for efficient semantic search.
