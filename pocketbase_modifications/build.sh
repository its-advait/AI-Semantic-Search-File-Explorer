#!/bin/bash

# Build script for AI File Explorer
# Builds binaries for Windows and macOS

echo "Building AI File Explorer binaries..."

# Build for current platform
echo "Building for current platform..."
go build -o ai-file-explorer .

# Build for Windows
echo "Building for Windows (amd64)..."
GOOS=windows GOARCH=amd64 go build -o ai-file-explorer-windows.exe .

# Build for macOS Intel
echo "Building for macOS Intel (amd64)..."
GOOS=darwin GOARCH=amd64 go build -o ai-file-explorer-macos-intel .

# Build for macOS Apple Silicon
echo "Building for macOS Apple Silicon (arm64)..."
GOOS=darwin GOARCH=arm64 go build -o ai-file-explorer-macos-arm64 .

echo "Build complete! Generated binaries:"
ls -la ai-file-explorer*

echo ""
echo "To run:"
echo "  macOS/Linux: ./ai-file-explorer serve"
echo "  Windows: ai-file-explorer-windows.exe serve"
