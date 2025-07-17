# Build stage
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git make gcc musl-dev sqlite-dev

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o ai-file-explorer .

# Runtime stage
FROM alpine:latest

# Install runtime dependencies
RUN apk add --no-cache ca-certificates sqlite

# Create app directory
WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/ai-file-explorer .

# Copy extensions directory (if exists)
COPY --from=builder /app/extensions ./extensions

# Create data directory for PocketBase
RUN mkdir -p /app/data

# Expose ports
EXPOSE 8090 8081

# Set environment variables
ENV POCKETBASE_DATA_DIR=/app/data
ENV MCP_PORT=8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8090/api/health || exit 1

# Run the application
CMD ["./ai-file-explorer", "serve", "--http=0.0.0.0:8090"]
