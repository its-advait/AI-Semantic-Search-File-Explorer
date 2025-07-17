#!/bin/bash

# AI File Explorer Test Script
# This script tests the basic functionality of the AI file explorer

set -e

API_BASE="http://localhost:8090"
MCP_BASE="http://localhost:8081"

echo "🤖 AI File Explorer Test Script"
echo "================================"

# Check if API is running
echo "📡 Checking API status..."
if curl -s "$API_BASE/api/health" > /dev/null 2>&1; then
    echo "✅ API is running"
else
    echo "❌ API is not running. Please start the server first."
    echo "Run: make run"
    exit 1
fi

# Check if MCP server is running
echo "🔗 Checking MCP server status..."
if curl -s "$MCP_BASE" > /dev/null 2>&1; then
    echo "✅ MCP server is running"
else
    echo "⚠️  MCP server is not responding (this is expected if not implemented yet)"
fi

# Test directory crawling
echo "📁 Testing directory crawling..."
TEST_DIR="/tmp/test-files"
mkdir -p "$TEST_DIR"
echo "This is a test file for AI file explorer" > "$TEST_DIR/test.txt"
echo "Another test file with different content" > "$TEST_DIR/test2.txt"

CRAWL_RESPONSE=$(curl -s -X POST "$API_BASE/api/crawl" \
    -H "Content-Type: application/json" \
    -d "{\"path\": \"$TEST_DIR\"}")

echo "Crawl response: $CRAWL_RESPONSE"

# Extract file ID from response (basic parsing)
FILE_ID=$(echo "$CRAWL_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$FILE_ID" ]; then
    echo "✅ Directory crawling successful. Found file ID: $FILE_ID"
    
    # Test embedding generation (only if OpenAI API key is set)
    if [ -n "$OPENAI_API_KEY" ]; then
        echo "🧠 Testing embedding generation..."
        EMBED_RESPONSE=$(curl -s -X POST "$API_BASE/api/embed" \
            -H "Content-Type: application/json" \
            -d "{\"file_id\": \"$FILE_ID\"}")
        
        echo "Embedding response: $EMBED_RESPONSE"
        
        if echo "$EMBED_RESPONSE" | grep -q "success"; then
            echo "✅ Embedding generation successful"
            
            # Test semantic search
            echo "🔍 Testing semantic search..."
            SEARCH_RESPONSE=$(curl -s -X POST "$API_BASE/api/search" \
                -H "Content-Type: application/json" \
                -d '{"query": "test file", "limit": 5}')
            
            echo "Search response: $SEARCH_RESPONSE"
            
            if echo "$SEARCH_RESPONSE" | grep -q "results"; then
                echo "✅ Semantic search successful"
            else
                echo "❌ Semantic search failed"
            fi
        else
            echo "❌ Embedding generation failed"
        fi
    else
        echo "⚠️  Skipping embedding and search tests (OPENAI_API_KEY not set)"
    fi
else
    echo "❌ Directory crawling failed"
fi

# Test collections endpoint
echo "📊 Testing collections endpoint..."
COLLECTIONS_RESPONSE=$(curl -s "$API_BASE/api/collections")
echo "Collections response: $COLLECTIONS_RESPONSE"

if echo "$COLLECTIONS_RESPONSE" | grep -q "files"; then
    echo "✅ Collections endpoint working"
else
    echo "❌ Collections endpoint failed"
fi

# Cleanup
rm -rf "$TEST_DIR"

echo ""
echo "🎉 Test completed!"
echo ""
echo "Next steps:"
echo "1. Set OPENAI_API_KEY environment variable for embedding functionality"
echo "2. Build sqlite-rembed extension (see README.md)"
echo "3. Open web interface at http://localhost:8080 (if using docker-compose)"
echo "4. Try the API endpoints manually or use the web interface"
