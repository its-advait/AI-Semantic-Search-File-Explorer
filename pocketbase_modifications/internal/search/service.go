package search

import (
	"log"

	"github.com/pocketbase/dbx"
)

// Service handles search operations
type Service struct {
	db               dbx.Builder
	embeddingService EmbeddingService
}

// EmbeddingService interface for generating embeddings
type EmbeddingService interface {
	GenerateEmbedding(content string) ([]float64, error)
}

// SearchResult represents a search result
type SearchResult struct {
	FileID  string  `json:"file_id"`
	Path    string  `json:"path"`
	Name    string  `json:"name"`
	Content string  `json:"content,omitempty"`
	Score   float64 `json:"score"`
}

// NewService creates a new search service
func NewService(db dbx.Builder) *Service {
	return &Service{
		db: db,
	}
}

// SetEmbeddingService sets the embedding service
func (s *Service) SetEmbeddingService(embeddingService EmbeddingService) {
	s.embeddingService = embeddingService
}

// VectorSearch performs semantic search using embeddings
func (s *Service) VectorSearch(query string, limit int) ([]SearchResult, error) {
	log.Printf("Vector search for: %s (limit: %d)", query, limit)
	// TODO: Implement actual vector search when sqlite-vec is available
	return []SearchResult{}, nil
}

// TextSearch performs text-based search
func (s *Service) TextSearch(query string, limit int) ([]SearchResult, error) {
	log.Printf("Text search for: %s (limit: %d)", query, limit)
	// TODO: Implement actual text search
	return []SearchResult{}, nil
}
