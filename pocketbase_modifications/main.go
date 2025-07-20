package main

import (
	"log"
	"os"

	"github.com/ai-file-explorer/pocketbase-modifications/internal/embeddings"
	"github.com/ai-file-explorer/pocketbase-modifications/internal/fileprocessor"
	"github.com/ai-file-explorer/pocketbase-modifications/internal/mcp"
	"github.com/ai-file-explorer/pocketbase-modifications/internal/search"
	"github.com/ai-file-explorer/pocketbase-modifications/internal/sqlite_driver"
	"github.com/joho/godotenv"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"github.com/spf13/cobra"
)

// createFilesCollection creates the files collection in PocketBase if it doesn't exist
func createFilesCollection(app *pocketbase.PocketBase) error {
	// Check if collection already exists
	var exists bool
	err := app.DB().NewQuery(`SELECT 1 FROM _collections WHERE name = 'files'`).Row(&exists)
	if err == nil && exists {
		return nil // Collection already exists
	}

	// Create the collection
	_, err = app.DB().NewQuery(`
		INSERT INTO _collections (id, created, updated, name, type, system, schema, listRule, viewRule, createRule, updateRule, deleteRule)
		VALUES (
			hex(randomblob(16)),
			strftime('%Y-%m-%d %H:%M:%fZ'),
			strftime('%Y-%m-%d %H:%M:%fZ'),
			'files',
			'base',
			0,
			'[
				{"system":false,"id":"path","name":"path","type":"text","required":true,"unique":true},
				{"system":false,"id":"name","name":"name","type":"text","required":true},
				{"system":false,"id":"size","name":"size","type":"number","required":true},
				{"system":false,"id":"content_type","name":"content_type","type":"text","required":true},
				{"system":false,"id":"content","name":"content","type":"text","required":false},
				{"system":false,"id":"extension","name":"extension","type":"text","required":true},
				{"system":false,"id":"mod_time","name":"mod_time","type":"date","required":true},
				{"system":false,"id":"embedding_status","name":"embedding_status","type":"text","required":true}
			]',
			null,
			null,
			null,
			null,
			null
		)
	`).Execute()

	return err
}

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: Failed to load .env file: %v", err)
	}

	// Initialize the PocketBase app
	app := pocketbase.NewWithConfig(pocketbase.Config{
		DefaultDataDir: "pb_data",
	})

	// Register the custom SQLite driver with extensions
	if err := sqlite_driver.InitCustomDriver(); err != nil {
		log.Fatalf("Failed to initialize custom SQLite driver: %v", err)
	}

	// Initialize the app (this will set up the database connection)
	if err := app.Bootstrap(); err != nil {
		log.Fatalf("Failed to bootstrap application: %v", err)
	}

	// Initialize services with the database connection
	searchSvc := search.NewService(app.DB())
	_ = searchSvc // Use searchSvc to avoid unused variable error
	
	embeddingSvc := embeddings.NewService(app.DB(), os.Getenv("OPENAI_API_KEY"))
	_ = embeddingSvc // Use embeddingSvc to avoid unused variable error

	// Create files collection on app start
	if err := createFilesCollection(app); err != nil {
		log.Printf("Warning: Failed to create files collection: %v", err)
	}

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
			pocketbaseURL := "http://127.0.0.1:8091"
			adminToken := os.Getenv("POCKETBASE_ADMIN_TOKEN")
			if adminToken == "" {
				log.Fatal("POCKETBASE_ADMIN_TOKEN environment variable is required")
			}
			
			processor := fileprocessor.NewService(
				app.DB(), 
				os.Getenv("OPENAI_API_KEY"),
				pocketbaseURL,
				adminToken,
			)
			
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

		// Add API routes for viewing files
		e.Router.GET("/api/files", func(e *core.RequestEvent) error {
			type FileRecord struct {
				Id              string `db:"id" json:"id"`
				Path            string `db:"path" json:"path"`
				Name            string `db:"name" json:"name"`
				Size            int64  `db:"size" json:"size"`
				ContentType     string `db:"content_type" json:"content_type"`
				Extension       string `db:"extension" json:"extension"`
				ModTime         string `db:"mod_time" json:"mod_time"`
				EmbeddingStatus string `db:"embedding_status" json:"embedding_status"`
				Created         string `db:"created" json:"created"`
				Updated         string `db:"updated" json:"updated"`
			}
			var files []FileRecord
			err := app.DB().NewQuery("SELECT id, path, name, size, content_type, extension, mod_time, embedding_status, created, updated FROM files ORDER BY created DESC LIMIT 100").All(&files)
			if err != nil {
				return e.JSON(500, map[string]string{"error": err.Error()})
			}
			return e.JSON(200, map[string]interface{}{"files": files, "count": len(files)})
		})

		e.Router.GET("/api/files/:id", func(e *core.RequestEvent) error {
			id := e.Request.PathValue("id")
			type FileRecord struct {
				Id              string `db:"id" json:"id"`
				Path            string `db:"path" json:"path"`
				Name            string `db:"name" json:"name"`
				Size            int64  `db:"size" json:"size"`
				ContentType     string `db:"content_type" json:"content_type"`
				Content         string `db:"content" json:"content"`
				Extension       string `db:"extension" json:"extension"`
				ModTime         string `db:"mod_time" json:"mod_time"`
				EmbeddingStatus string `db:"embedding_status" json:"embedding_status"`
				Created         string `db:"created" json:"created"`
				Updated         string `db:"updated" json:"updated"`
			}
			var file FileRecord
			err := app.DB().NewQuery("SELECT * FROM files WHERE id = {:id}").Bind(map[string]any{"id": id}).One(&file)
			if err != nil {
				return e.JSON(404, map[string]string{"error": "File not found"})
			}
			return e.JSON(200, file)
		})

		e.Router.GET("/api/embeddings", func(e *core.RequestEvent) error {
			type EmbeddingRecord struct {
				FileId     string `db:"file_id" json:"file_id"`
				ChunkIndex int    `db:"chunk_index" json:"chunk_index"`
				ChunkText  string `db:"chunk_text" json:"chunk_text"`
			}
			var embeddings []EmbeddingRecord
			err := app.DB().NewQuery("SELECT file_id, chunk_index, chunk_text FROM file_embeddings LIMIT 50").All(&embeddings)
			if err != nil {
				return e.JSON(500, map[string]string{"error": err.Error()})
			}
			return e.JSON(200, map[string]interface{}{"embeddings": embeddings, "count": len(embeddings)})
		})

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
