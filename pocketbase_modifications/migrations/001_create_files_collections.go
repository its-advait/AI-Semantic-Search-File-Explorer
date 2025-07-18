package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		db := app.DB()
		// Create files table with PocketBase-compatible structure
		_, err := db.NewQuery(`
			CREATE TABLE IF NOT EXISTS files (
				id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
				path TEXT UNIQUE NOT NULL,
				name TEXT NOT NULL,
				size INTEGER,
				content_type TEXT,
				content TEXT,
				extension TEXT,
				mod_time TEXT,
				embedding_status TEXT DEFAULT 'pending',
				created TEXT DEFAULT (datetime('now')),
				updated TEXT DEFAULT (datetime('now'))
			)
		`).Execute()
		if err != nil {
			return err
		}

		// Create indexes
		_, err = db.NewQuery(`CREATE INDEX IF NOT EXISTS idx_files_path ON files (path)`).Execute()
		if err != nil {
			return err
		}

		_, err = db.NewQuery(`CREATE INDEX IF NOT EXISTS idx_files_extension ON files (extension)`).Execute()
		if err != nil {
			return err
		}

		_, err = db.NewQuery(`CREATE INDEX IF NOT EXISTS idx_files_embedding_status ON files (embedding_status)`).Execute()
		return err
	}, func(app core.App) error {
		// Drop the files table
		_, err := app.DB().NewQuery(`DROP TABLE IF EXISTS files`).Execute()
		return err
	})
}
