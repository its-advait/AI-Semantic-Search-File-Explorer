package sqlite_driver

import (
	"database/sql"
	"database/sql/driver"
	"log"
	"path/filepath"

	"github.com/mattn/go-sqlite3"
	sqlite_vec "github.com/asg017/sqlite-vec-go-bindings/cgo"
)

// CustomSQLiteDriver extends the standard SQLite driver with vector extensions
type CustomSQLiteDriver struct {
	*sqlite3.SQLiteDriver
}

// InitCustomDriver registers the custom SQLite driver with vec and rembed extensions
func InitCustomDriver() error {
	// Enable sqlite-vec for all future connections
	sqlite_vec.Auto()
	log.Println("✅ sqlite-vec enabled globally")

	// Register the custom driver
	sql.Register("sqlite-vec-rembed", &CustomSQLiteDriver{
		SQLiteDriver: &sqlite3.SQLiteDriver{
			ConnectHook: func(conn *sqlite3.SQLiteConn) error {
				// Load sqlite-rembed extension
				rembedPath := filepath.Join("extensions", "rembed.dylib")
				if err := conn.LoadExtension(rembedPath, "sqlite3_rembed_init"); err != nil {
					log.Printf("Warning: Failed to load sqlite-rembed extension: %v", err)
				} else {
					log.Println("✅ sqlite-rembed extension loaded successfully")
				}

				// Test sqlite-vec availability
				if _, err := conn.Exec("SELECT vec_version()", nil); err != nil {
					log.Printf("Warning: sqlite-vec not available: %v", err)
				} else {
					log.Println("✅ sqlite-vec extension available")
				}
				// vecPath := filepath.Join("extensions", "vec.dylib")
				// if err := conn.LoadExtension(vecPath, "sqlite3_vec_init"); err != nil {
				//     log.Printf("Warning: Failed to load sqlite-vec extension: %v", err)
				// }

				return nil
			},
		},
	})

	return nil
}

// init automatically initializes the custom SQLite driver when the package is imported
func init() {
	if err := InitCustomDriver(); err != nil {
		log.Printf("Failed to initialize custom SQLite driver: %v", err)
	}
}

// Open implements the driver.Driver interface
func (d *CustomSQLiteDriver) Open(name string) (driver.Conn, error) {
	return d.SQLiteDriver.Open(name)
}
