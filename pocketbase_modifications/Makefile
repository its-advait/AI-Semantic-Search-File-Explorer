# AI File Explorer - PocketBase Extensions Makefile

.PHONY: build run clean test deps extensions help

# Default target
all: build

# Build the application
build:
	@echo "Building AI File Explorer..."
	/usr/local/go/bin/go build -o ai-file-explorer .

# Run the application
run: build
	@echo "Starting AI File Explorer..."
	./ai-file-explorer serve

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f ai-file-explorer
	/usr/local/go/bin/go clean

# Download dependencies
deps:
	@echo "Downloading dependencies..."
	/usr/local/go/bin/go mod download
	/usr/local/go/bin/go mod tidy

# Setup extensions directory
extensions:
	@echo "Setting up extensions directory..."
	mkdir -p extensions
	@echo "Note: You need to manually build and copy rembed.so to the extensions/ directory"
	@echo "See README.md for instructions"

# Run tests
test:
	@echo "Running tests..."
	/usr/local/go/bin/go test ./...

# Development mode with auto-reload (requires air)
dev:
	@if command -v air > /dev/null; then \
		air; \
	else \
		echo "air not found. Install with: /usr/local/go/bin/go install github.com/cosmtrek/air@latest"; \
		echo "Falling back to normal run..."; \
		make run; \
	fi

# Format code
fmt:
	@echo "Formatting code..."
	/usr/local/go/bin/go fmt ./...

# Lint code (requires golangci-lint)
lint:
	@if command -v golangci-lint > /dev/null; then \
		golangci-lint run; \
	else \
		echo "golangci-lint not found. Install from https://golangci-lint.run/"; \
	fi

# Install development tools
install-tools:
	@echo "Installing development tools..."
	go install github.com/cosmtrek/air@latest
	@echo "Install golangci-lint from https://golangci-lint.run/"

# Build sqlite-rembed extension (requires sqlite-rembed source)
build-rembed:
	@echo "Building sqlite-rembed extension..."
	@if [ ! -d "sqlite-rembed" ]; then \
		echo "Cloning sqlite-rembed..."; \
		git clone https://github.com/asg017/sqlite-rembed; \
	fi
	@cd sqlite-rembed && make loadable
	@mkdir -p extensions
	@cp sqlite-rembed/dist/rembed.so extensions/
	@echo "sqlite-rembed extension built and copied to extensions/"

# Check environment
check-env:
	@echo "Checking environment..."
	@if [ -z "$$OPENAI_API_KEY" ]; then \
		echo "❌ OPENAI_API_KEY not set"; \
	else \
		echo "✅ OPENAI_API_KEY is set"; \
	fi
	@if [ -f "extensions/rembed.so" ]; then \
		echo "✅ rembed.so extension found"; \
	else \
		echo "❌ rembed.so extension not found in extensions/"; \
	fi

# Docker build
docker-build:
	@echo "Building Docker image..."
	docker build -t ai-file-explorer .

# Docker run
docker-run: docker-build
	@echo "Running Docker container..."
	docker run -p 8090:8090 -p 8081:8081 \
		-e OPENAI_API_KEY=$$OPENAI_API_KEY \
		-v $(PWD)/data:/app/data \
		ai-file-explorer

# Help
help:
	@echo "AI File Explorer - Available commands:"
	@echo ""
	@echo "  build          Build the application"
	@echo "  run            Build and run the application"
	@echo "  clean          Clean build artifacts"
	@echo "  deps           Download and tidy dependencies"
	@echo "  extensions     Setup extensions directory"
	@echo "  test           Run tests"
	@echo "  dev            Run in development mode with auto-reload"
	@echo "  fmt            Format code"
	@echo "  lint           Lint code"
	@echo "  install-tools  Install development tools"
	@echo "  build-rembed   Build sqlite-rembed extension"
	@echo "  check-env      Check environment setup"
	@echo "  docker-build   Build Docker image"
	@echo "  docker-run     Run in Docker container"
	@echo "  help           Show this help message"
	@echo ""
	@echo "Environment variables:"
	@echo "  OPENAI_API_KEY - Required for embedding generation"
	@echo "  MCP_PORT       - Optional, MCP server port (default: 8081)"
