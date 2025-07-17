package fileprocessor

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/ai-file-explorer/pocketbase-modifications/internal/crawler"
	"github.com/ai-file-explorer/pocketbase-modifications/internal/embeddings"
	"github.com/pocketbase/dbx"
)

// Service handles file processing and embedding generation
type Service struct {
	db               dbx.Builder
	crawler         *crawler.Service
	embeddingService *embeddings.Service
}

// NewService creates a new file processor service
func NewService(db dbx.Builder) *Service {
	return &Service{
		db:               db,
		crawler:         crawler.NewService(),
		embeddingService: embeddings.NewService(db),
	}
}

// ProcessDirectory crawls a directory and processes all files
func (s *Service) ProcessDirectory(dirPath string) error {
	log.Printf("🕷️  Processing directory: %s", dirPath)
	
	// Crawl the directory
	files, err := s.crawler.CrawlDirectory(dirPath)
	if err != nil {
		return fmt.Errorf("failed to crawl directory: %w", err)
	}
	
	log.Printf("📄 Found %d files to process", len(files))
	
	// Process each file
	for i, file := range files {
		log.Printf("📄 Processing file %d/%d: %s", i+1, len(files), file.Name)
		
		if err := s.processFile(file); err != nil {
			log.Printf("❌ Failed to process file %s: %v", file.Path, err)
			continue
		}
		
		log.Printf("✅ Successfully processed: %s", file.Name)
	}
	
	log.Printf("🎉 Completed processing %d files", len(files))
	return nil
}

// processFile processes a single file and generates embeddings
func (s *Service) processFile(file crawler.FileInfo) error {
	// Check if file already exists in database
	var existingId string
	err := s.db.NewQuery(`
		SELECT id FROM files WHERE path = {:path}
	`).Bind(map[string]any{
		"path": file.Path,
	}).Row(&existingId)
	
	var fileId string
	if err != nil {
		// Insert new file record
		result, err := s.db.NewQuery(`
			INSERT INTO files (path, name, size, content_type, content, extension, mod_time, embedding_status, created, updated)
			VALUES ({:path}, {:name}, {:size}, {:content_type}, {:content}, {:extension}, {:mod_time}, 'pending', datetime('now'), datetime('now'))
		`).Bind(map[string]any{
			"path":         file.Path,
			"name":         file.Name,
			"size":         file.Size,
			"content_type": file.ContentType,
			"content":      file.Content,
			"extension":    file.Extension,
			"mod_time":     file.ModTime.Format("2006-01-02 15:04:05"),
		}).Execute()
		
		if err != nil {
			return fmt.Errorf("failed to insert file record: %w", err)
		}
		
		lastId, _ := result.LastInsertId()
		fileId = fmt.Sprintf("%d", lastId)
	} else {
		// Update existing file record
		fileId = existingId
		_, err = s.db.NewQuery(`
			UPDATE files SET 
				name = {:name},
				size = {:size},
				content_type = {:content_type},
				content = {:content},
				extension = {:extension},
				mod_time = {:mod_time},
				updated = datetime('now')
			WHERE id = {:id}
		`).Bind(map[string]any{
			"id":           fileId,
			"name":         file.Name,
			"size":         file.Size,
			"content_type": file.ContentType,
			"content":      file.Content,
			"extension":    file.Extension,
			"mod_time":     file.ModTime.Format("2006-01-02 15:04:05"),
		}).Execute()
		
		if err != nil {
			return fmt.Errorf("failed to update file record: %w", err)
		}
	}
	
	// Generate embeddings if content is available
	if file.Content != "" && !strings.Contains(file.Content, "Content extraction not implemented") {
		if err := s.generateEmbeddings(fileId, file.Content); err != nil {
			log.Printf("⚠️  Failed to generate embeddings for %s: %v", file.Path, err)
			s.updateEmbeddingStatus(fileId, "failed")
		} else {
			s.updateEmbeddingStatus(fileId, "completed")
		}
	}
	
	return nil
}

// updateEmbeddingStatus updates the embedding status for a file
func (s *Service) updateEmbeddingStatus(fileId, status string) {
	_, err := s.db.NewQuery(`
		UPDATE files SET embedding_status = {:status}, updated = datetime('now') WHERE id = {:id}
	`).Bind(map[string]any{
		"id":     fileId,
		"status": status,
	}).Execute()
	
	if err != nil {
		log.Printf("⚠️  Failed to update embedding status: %v", err)
	}
}

// generateEmbeddings generates embeddings for file content
func (s *Service) generateEmbeddings(fileId string, content string) error {
	// Split content into chunks (simple implementation)
	chunks := s.splitIntoChunks(content, 1000) // 1000 character chunks
	
	for i, chunk := range chunks {
		// Generate embedding for chunk
		embedding, err := s.embeddingService.GenerateEmbedding(chunk)
		if err != nil {
			return fmt.Errorf("failed to generate embedding for chunk %d: %w", i, err)
		}
		
		// Convert float64 to float32 for sqlite-vec
		embedding32 := make([]float32, len(embedding))
		for j, v := range embedding {
			embedding32[j] = float32(v)
		}
		
		// Store the embedding
		if err := s.storeEmbedding(fileId, i, chunk, embedding32); err != nil {
			return fmt.Errorf("failed to store embedding for chunk %d: %w", i, err)
		}
	}
	
	return nil
}

// splitIntoChunks splits text into chunks of specified size
func (s *Service) splitIntoChunks(text string, chunkSize int) []string {
	if len(text) <= chunkSize {
		return []string{text}
	}
	
	var chunks []string
	for i := 0; i < len(text); i += chunkSize {
		end := i + chunkSize
		if end > len(text) {
			end = len(text)
		}
		chunks = append(chunks, text[i:end])
	}
	
	return chunks
}

// storeEmbedding stores an embedding in the sqlite-vec table
func (s *Service) storeEmbedding(fileId string, chunkIndex int, chunkText string, embedding []float32) error {
	// Convert to string format for SQL
	embeddingStr := "["
	for i, v := range embedding {
		if i > 0 {
			embeddingStr += ","
		}
		embeddingStr += fmt.Sprintf("%f", v)
	}
	embeddingStr += "]"
	
	// Insert into sqlite-vec table
	_, err := s.db.NewQuery(`
		INSERT INTO file_embeddings (file_id, chunk_index, chunk_text, embedding)
		VALUES ({:file_id}, {:chunk_index}, {:chunk_text}, {:embedding})
	`).Bind(map[string]any{
		"file_id":     fileId,
		"chunk_index": chunkIndex,
		"chunk_text":  chunkText,
		"embedding":   embeddingStr,
	}).Execute()
	
	return err
}

// SearchSimilarFiles searches for similar files using vector similarity
func (s *Service) SearchSimilarFiles(query string, limit int) ([]SearchResult, error) {
	// Generate embedding for query
	queryEmbedding, err := s.embeddingService.GenerateEmbedding(query)
	if err != nil {
		return nil, fmt.Errorf("failed to generate query embedding: %w", err)
	}
	
	// Convert to string format for SQL
	embeddingStr := "["
	for i, v := range queryEmbedding {
		if i > 0 {
			embeddingStr += ","
		}
		embeddingStr += fmt.Sprintf("%f", v)
	}
	embeddingStr += "]"
	
	// Search using sqlite-vec
	rows, err := s.db.NewQuery(`
		SELECT 
			fe.file_id,
			fe.chunk_text,
			fe.chunk_index,
			distance
		FROM file_embeddings fe
		WHERE fe.embedding MATCH {:query_embedding}
		ORDER BY distance
		LIMIT {:limit}
	`).Bind(map[string]any{
		"query_embedding": embeddingStr,
		"limit":          limit,
	}).Rows()
	
	if err != nil {
		return nil, fmt.Errorf("failed to search embeddings: %w", err)
	}
	defer rows.Close()
	
	var results []SearchResult
	for rows.Next() {
		var result SearchResult
		if err := rows.Scan(&result.FileId, &result.ChunkText, &result.ChunkIndex, &result.Distance); err != nil {
			continue
		}
		
		// Get file details from database
		err := s.db.NewQuery(`
			SELECT name, path, content_type FROM files WHERE id = {:id}
		`).Bind(map[string]any{
			"id": result.FileId,
		}).Row(&result.FileName, &result.FilePath, &result.ContentType)
		
		if err != nil {
			continue
		}
		
		results = append(results, result)
	}
	
	return results, nil
}

// SearchResult represents a search result
type SearchResult struct {
	FileId      string  `json:"file_id"`
	FileName    string  `json:"file_name"`
	FilePath    string  `json:"file_path"`
	ContentType string  `json:"content_type"`
	ChunkText   string  `json:"chunk_text"`
	ChunkIndex  int     `json:"chunk_index"`
	Distance    float64 `json:"distance"`
}
