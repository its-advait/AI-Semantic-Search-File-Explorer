package fileprocessor

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"path/filepath"
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
	pocketbaseURL   string
	adminToken      string
}

// NewService creates a new file processor service
func NewService(db dbx.Builder, apiKey string, pocketbaseURL, adminToken string) *Service {
	return &Service{
		db:               db,
		crawler:         crawler.NewService(),
		embeddingService: embeddings.NewService(db, apiKey),
		pocketbaseURL:    pocketbaseURL,
		adminToken:       adminToken,
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

// authenticateAdmin authenticates with PocketBase and returns a session token
func (s *Service) authenticateAdmin() (string, error) {
	// Create auth request body
	authData := map[string]string{
		"identity": "C9ne7298@gmail.com",
		"password": "ZeroIsKing7298!",
	}
	jsonData, err := json.Marshal(authData)
	if err != nil {
		return "", fmt.Errorf("failed to marshal auth data: %w", err)
	}

	// Create auth request
	req, err := http.NewRequest("POST", s.pocketbaseURL+"/api/admins/auth-with-password", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create auth request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	// Send auth request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send auth request: %w", err)
	}
	defer resp.Body.Close()

	// Check auth response status
	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("authentication failed: %s - %s", resp.Status, string(respBody))
	}

	// Parse auth response to get token
	var authResult struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&authResult); err != nil {
		return "", fmt.Errorf("failed to parse auth response: %w", err)
	}

	if authResult.Token == "" {
		return "", fmt.Errorf("empty token in auth response")
	}

	return authResult.Token, nil
}

// processFile processes a single file and stores it in PocketBase
func (s *Service) processFile(file crawler.FileInfo) error {
	// Create a buffer to store the request body
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	
	// Add file fields to the form
	part, err := writer.CreateFormFile("file", filepath.Base(file.Path))
	if err != nil {
		return fmt.Errorf("failed to create form file: %w", err)
	}
	
	// Write file content to the form
	_, err = io.WriteString(part, file.Content)
	if err != nil {
		return fmt.Errorf("failed to write file content: %w", err)
	}
	
	// Add metadata fields
	_ = writer.WriteField("name", file.Name)
	_ = writer.WriteField("path", file.Path)
	_ = writer.WriteField("size", fmt.Sprintf("%d", file.Size))
	_ = writer.WriteField("content_type", file.ContentType)
	_ = writer.WriteField("extension", file.Extension)
	_ = writer.WriteField("mod_time", file.ModTime.Format(time.RFC3339))
	_ = writer.WriteField("embedding_status", "pending")
	
	// Close the writer to finalize the form
	err = writer.Close()
	if err != nil {
		return fmt.Errorf("failed to close form writer: %w", err)
	}
	
	// Create a new request
	req, err := http.NewRequest("POST", s.pocketbaseURL+"/api/collections/RealFiles/records", body)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	
	// Set headers
	req.Header.Set("Content-Type", writer.FormDataContentType())
	
	// Try different authentication methods
	authMethods := []struct {
		header string
		value string
	}{
		{"X-PocketBase-Token", s.adminToken},  // Try X-PocketBase-Token header
		{"Authorization", "Bearer " + s.adminToken},  // Try Bearer token
		{"Authorization", "Token " + s.adminToken},   // Try Token prefix
		{"Authorization", s.adminToken},              // Try raw token
	}
	
	var lastError error
	
	for _, auth := range authMethods {
		// Create a new request for each attempt to avoid header conflicts
		req, err := http.NewRequest("POST", s.pocketbaseURL+"/api/collections/RealFiles/records", body)
		if err != nil {
			lastError = fmt.Errorf("failed to create request: %w", err)
			continue
		}
		
		// Set headers
		req.Header.Set("Content-Type", writer.FormDataContentType())
		req.Header.Set(auth.header, auth.value)
		
		// Truncate token for logging (show first 5 chars)
		tokenPreview := auth.value
		if len(tokenPreview) > 5 {
			tokenPreview = tokenPreview[:5] + "..."
		}
		log.Printf("Trying authentication with %s: %s", auth.header, tokenPreview)
		
		// Send the request
		client := &http.Client{
			Timeout: 30 * time.Second,
		}
		resp, err := client.Do(req)
		if err != nil {
			lastError = fmt.Errorf("failed to send request: %w", err)
			continue
		}
		defer resp.Body.Close()
		
		// Read the response body for debugging
		respBody, _ := io.ReadAll(resp.Body)
		
		// Check response status
		if resp.StatusCode >= 400 {
			lastError = fmt.Errorf("failed to upload file (auth: %s): %s - %s", 
				auth.header, resp.Status, string(respBody))
			continue
		}
		
		// If we got here, the request was successful
		log.Printf("✅ Successfully uploaded file with %s", auth.header)
		
		// Parse response to get file ID
		var result struct {
			ID string `json:"id"`
		}
		if err := json.Unmarshal(respBody, &result); err != nil {
			return fmt.Errorf("failed to parse response: %w", err)
		}
		
		// Generate embeddings if content is available
		if file.Content != "" && !strings.Contains(file.Content, "Content extraction not implemented") {
			if err := s.generateEmbeddings(result.ID, file.Content); err != nil {
				log.Printf("⚠️  Failed to generate embeddings for %s: %v", file.Path, err)
				s.updateEmbeddingStatus(result.ID, "failed")
			} else {
				s.updateEmbeddingStatus(result.ID, "completed")
			}
		}
		
		return nil
	}
	
	// If we get here, all authentication methods failed
	return fmt.Errorf("all authentication methods failed. Last error: %w", lastError)
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
