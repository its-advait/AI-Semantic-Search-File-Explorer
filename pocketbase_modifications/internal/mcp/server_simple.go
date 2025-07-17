package mcp

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/pocketbase/dbx"
)

// SimpleMCPServer implements a basic MCP server
type SimpleMCPServer struct {
	db dbx.Builder
}

// NewSimpleMCPServer creates a new simple MCP server
func NewSimpleMCPServer(db dbx.Builder) *SimpleMCPServer {
	return &SimpleMCPServer{
		db: db,
	}
}

// Start starts the MCP server on the specified port
func (s *SimpleMCPServer) Start(port string) error {
	http.HandleFunc("/", s.handleRoot)
	http.HandleFunc("/health", s.handleHealth)

	log.Printf("Starting MCP server on port %s", port)
	return http.ListenAndServe(":"+port, nil)
}

// handleRoot handles the root endpoint
func (s *SimpleMCPServer) handleRoot(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"name":        "PocketBase AI File Explorer",
		"version":     "1.0.0",
		"description": "AI-powered file management system",
		"status":      "running",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handleHealth handles health check endpoint
func (s *SimpleMCPServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
}
