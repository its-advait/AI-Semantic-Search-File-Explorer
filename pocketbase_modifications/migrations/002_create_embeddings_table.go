package migrations

import (
	"github.com/pocketbase/dbx"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		// Create embeddings table using sqlite-vec
		_, err := db.NewQuery(`
			CREATE VIRTUAL TABLE IF NOT EXISTS file_embeddings USING vec0(
				id INTEGER PRIMARY KEY,
				file_id TEXT NOT NULL,
				chunk_index INTEGER DEFAULT 0,
				chunk_text TEXT NOT NULL,
				embedding FLOAT[1536],
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)
		`).Execute()
		
		if err != nil {
			return err
		}

		// Create index for file_id lookups
		_, err = db.NewQuery(`
			CREATE INDEX IF NOT EXISTS idx_file_embeddings_file_id 
			ON file_embeddings(file_id)
		`).Execute()
		
		return err
	}, func(db dbx.Builder) error {
		// Drop the embeddings table
		_, err := db.NewQuery("DROP TABLE IF EXISTS file_embeddings").Execute()
		return err
	})
}
