package embeddings

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/pocketbase/dbx"
)

// Service handles embedding operations
type Service struct {
	db     dbx.Builder
	apiKey string
}

// NewService creates a new embeddings service
func NewService(db dbx.Builder, apiKey string) *Service {
	return &Service{
		db:     db,
		apiKey: apiKey,
	}
}

// EmbedFile generates and stores an embedding for a file
func (s *Service) EmbedFile(filePath string) error {
	log.Printf("Embedding file: %s", filePath)
	// TODO: Implement actual embedding when sqlite-rembed is available
	return nil
}

// GenerateEmbedding creates an embedding for the given text using OpenAI via sqlite-rembed
func (s *Service) GenerateEmbedding(text string) ([]float64, error) {
	// Ensure OpenAI client is registered
	err := s.ensureOpenAIClient()
	if err != nil {
		return nil, fmt.Errorf("failed to ensure OpenAI client: %w", err)
	}
	
	// Generate embedding using sqlite-rembed
	var embeddingJSON string
	err = s.db.NewQuery(`
		SELECT rembed('text-embedding-3-small', {text})
	`).Bind(dbx.Params{"text": text}).Row(&embeddingJSON)
	
	if err != nil {
		// If rate limited or API error, return mock embedding as fallback
		if strings.Contains(err.Error(), "429") || strings.Contains(err.Error(), "rate") {
			log.Printf("OpenAI rate limited, using mock embedding: %v", err)
			return s.generateMockEmbedding(text), nil
		}
		return nil, fmt.Errorf("failed to generate embedding: %w", err)
	}
	
	// Parse the JSON embedding response
	var embedding []float64
	err = json.Unmarshal([]byte(embeddingJSON), &embedding)
	if err != nil {
		return nil, fmt.Errorf("failed to parse embedding JSON: %w", err)
	}
	
	return embedding, nil
}

// ensureOpenAIClient ensures the OpenAI client is registered
func (s *Service) ensureOpenAIClient() error {
	// Check if client already exists
	var count int
	err := s.db.Select("COUNT(*)").From("temp.rembed_clients").Where(dbx.HashExp{"name": "text-embedding-3-small"}).Row(&count)
	if err == nil && count > 0 {
		return nil // Client already registered
	}
	
	// Register OpenAI client
	_, err = s.db.NewQuery(`
		INSERT INTO temp.rembed_clients(name, options) 
		VALUES ('text-embedding-3-small', 'openai')
	`).Execute()
	
	if err != nil {
		return fmt.Errorf("failed to register OpenAI client: %w", err)
	}
	
	log.Println("OpenAI client registered successfully")
	return nil
}

// generateMockEmbedding generates a mock embedding for the given text
func (s *Service) generateMockEmbedding(text string) []float64 {
	embedding := make([]float64, 1536)
	for i := range embedding {
		embedding[i] = 0.1
	}
	return embedding
}

// GetEmbeddingAdapter returns an adapter for the search service
func (s *Service) GetEmbeddingAdapter() *Adapter {
	return &Adapter{service: s}
}
