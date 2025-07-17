package crawler

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// Service handles file crawling operations
type Service struct {
	maxFileSize int64 // Maximum file size to process (in bytes)
	includeContent bool // Whether to read file contents
}

// FileInfo represents information about a crawled file
type FileInfo struct {
	Path        string    `json:"path"`
	Name        string    `json:"name"`
	Size        int64     `json:"size"`
	ContentType string    `json:"content_type"`
	Content     string    `json:"content,omitempty"`
	ModTime     time.Time `json:"mod_time"`
	Extension   string    `json:"extension"`
}

// CrawlOptions configures the crawling behavior
type CrawlOptions struct {
	IncludeContent bool     // Whether to read file contents
	MaxFileSize    int64    // Maximum file size to process (default: 1MB)
	FileTypes      []string // Specific file extensions to include (empty = all text files)
	ExcludeDirs    []string // Directories to exclude (e.g., ".git", "node_modules")
	MaxDepth       int      // Maximum directory depth (0 = unlimited)
}

// NewService creates a new crawler service with default settings
func NewService() *Service {
	return &Service{
		maxFileSize: 1024 * 1024, // 1MB default
		includeContent: true,
	}
}

// NewServiceWithOptions creates a new crawler service with custom options
func NewServiceWithOptions(maxFileSize int64, includeContent bool) *Service {
	return &Service{
		maxFileSize: maxFileSize,
		includeContent: includeContent,
	}
}

// CrawlDirectory crawls a directory and returns file information
func (s *Service) CrawlDirectory(dirPath string) ([]FileInfo, error) {
	log.Printf("Crawling directory: %s", dirPath)

	var files []FileInfo

	err := filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip directories and hidden files
		if info.IsDir() || strings.HasPrefix(info.Name(), ".") {
			return nil
		}

		// Only process document files for MVP
		if !isDocumentFile(path) {
			return nil
		}

		// Skip large files (>5MB)
		if info.Size() > 5*1024*1024 {
			log.Printf("Skipping large file: %s (%.2f MB)", path, float64(info.Size())/(1024*1024))
			return nil
		}

		fileInfo := FileInfo{
			Path:        path,
			Name:        info.Name(),
			Size:        info.Size(),
			ContentType: getContentType(path),
			ModTime:     info.ModTime(),
			Extension:   strings.ToLower(filepath.Ext(path)),
		}

		// Read file content for text files
		if content, err := readFileContent(path); err != nil {
			log.Printf("Warning: Failed to read content from %s: %v", path, err)
		} else {
			fileInfo.Content = content
		}

		files = append(files, fileInfo)
		return nil
	})

	if err != nil {
		return nil, err
	}

	log.Printf("Found %d files in %s", len(files), dirPath)
	return files, nil
}

// isDocumentFile checks if a file is a document file we want to process
func isDocumentFile(path string) bool {
	ext := strings.ToLower(filepath.Ext(path))
	// Focus on document files for MVP
	docExts := []string{".txt", ".md", ".pdf", ".doc", ".docx", ".rtf"}

	for _, docExt := range docExts {
		if ext == docExt {
			return true
		}
	}
	return false
}

// readFileContent reads the content of a file
func readFileContent(path string) (string, error) {
	ext := strings.ToLower(filepath.Ext(path))
	
	switch ext {
	case ".txt", ".md", ".rtf":
		// Read plain text files directly
		content, err := ioutil.ReadFile(path)
		if err != nil {
			return "", err
		}
		return string(content), nil
		
	case ".pdf":
		// For PDF files, return a placeholder for now
		// In a full implementation, you'd use a PDF library like github.com/ledongthuc/pdf
		return fmt.Sprintf("[PDF Document: %s - Content extraction not implemented yet]", filepath.Base(path)), nil
		
	case ".doc", ".docx":
		// For Word documents, return a placeholder for now
		// In a full implementation, you'd use a library like github.com/fumiama/go-docx
		return fmt.Sprintf("[Word Document: %s - Content extraction not implemented yet]", filepath.Base(path)), nil
		
	default:
		return "", fmt.Errorf("unsupported file type: %s", ext)
	}
}

// getContentType returns the content type based on file extension
func getContentType(path string) string {
	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".txt":
		return "text/plain"
	case ".md":
		return "text/markdown"
	case ".pdf":
		return "application/pdf"
	case ".doc":
		return "application/msword"
	case ".docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case ".rtf":
		return "application/rtf"
	default:
		return "text/plain"
	}
}
