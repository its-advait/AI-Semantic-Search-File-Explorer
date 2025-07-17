package main

import (
	"log"
	"os"

	"github.com/ai-file-explorer/pocketbase-modifications/internal/embeddings"
	"github.com/ai-file-explorer/pocketbase-modifications/internal/fileprocessor"
	"github.com/ai-file-explorer/pocketbase-modifications/internal/mcp"
	"github.com/ai-file-explorer/pocketbase-modifications/internal/search"
	_ "github.com/ai-file-explorer/pocketbase-modifications/internal/sqlite_driver"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"github.com/spf13/cobra"
)

func main() {
	app := pocketbase.New()

	// Add migrate command
	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		TemplateLang: migratecmd.TemplateLangJS,
	})

	// Add crawl command
	app.RootCmd.AddCommand(&cobra.Command{
		Use:   "crawl [directory]",
		Short: "Crawl a directory and process files for embedding",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			dirPath := args[0]
			log.Printf("🕷️  Starting file crawl of: %s", dirPath)

			// Initialize the app without starting the server
			if err := app.Bootstrap(); err != nil {
				log.Fatalf("Failed to bootstrap app: %v", err)
			}

			// Create file processor service
			processor := fileprocessor.NewService(app.DB(), os.Getenv("OPENAI_API_KEY"))
			
			// Process the directory
			if err := processor.ProcessDirectory(dirPath); err != nil {
				log.Fatalf("Failed to process directory: %v", err)
			}

			log.Println("✅ File crawl completed successfully!")
		},
	})

	// Global service instances
	var (
		embeddingService *embeddings.Service
		searchService    *search.Service
	)

	// Initialize services once
	app.OnServe().BindFunc(func(e *core.ServeEvent) error {
		// Initialize services with PocketBase DB
		embeddingService = embeddings.NewService(app.DB(), os.Getenv("OPENAI_API_KEY"))
		searchService = search.NewService(app.DB())
		mcpServer := mcp.NewSimpleMCPServer(app.DB())

		// Set up service dependencies
		searchService.SetEmbeddingService(embeddingService.GetEmbeddingAdapter())

		// Start MCP server in a goroutine
		mcpPort := os.Getenv("MCP_PORT")
		if mcpPort == "" {
			mcpPort = "8081"
		}

		go func() {
			log.Printf("Starting MCP server on port %s", mcpPort)
			if err := mcpServer.Start(mcpPort); err != nil {
				log.Printf("MCP server error: %v", err)
			}
		}()

		return e.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
