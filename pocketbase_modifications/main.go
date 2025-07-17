
package main

import (
	"database/sql"
	"log"
	"os"

	"github.com/pocketbase/pocketbase"
	"github.com/asg017/sqlite-vec-go-bindings/cgo"
	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// register the custom sqlite driver
	sql.Register("sqlite-vec-rembed", &sqlite3.SQLiteDriver{
		ConnectHook: func(conn *sqlite3.SQLiteConn) error {
			if err := conn.RegisterFunc("vec_version", func() string {
				return cgo.VecVersion()
			}, true); err != nil {
				return err
			}
			// Since there is no direct Go binding for sqlite-rembed,
			// we have to load it as a runtime-loadable extension.
			// This requires building sqlite-rembed as a shared library
			// and placing it in a location where the application can find it.
			// For now, we'll assume it's in the same directory as the executable.
			if err := conn.LoadExtension("./rembed.so", "sqlite3_rembed_init"); err != nil {
				return err
			}
			return nil
		},
	})

	app := pocketbase.NewWithConfig(pocketbase.Config{
		DBPath: "./data.db",
	})

	// Set the custom driver
	app.Dao().DB().DriverName = "sqlite-vec-rembed"

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
