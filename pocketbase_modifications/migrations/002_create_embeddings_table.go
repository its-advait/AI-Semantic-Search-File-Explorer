package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		db := app.DB()
		// Create virtual table for embeddings using sqlite-vec
		_, err := db.NewQuery(`
			CREATE VIRTUAL TABLE IF NOT EXISTS file_embeddings USING vec0(
				file_id TEXT,
				chunk_index INTEGER,
				chunk_text TEXT,
				embedding FLOAT[1536]
			)
		`).Execute()
		return err
	}, func(app core.App) error {
		// Drop the virtual table
		_, err := app.DB().NewQuery(`DROP TABLE IF EXISTS file_embeddings`).Execute()
		return err
	})
}
