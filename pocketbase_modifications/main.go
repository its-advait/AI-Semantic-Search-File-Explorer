package main

import (
	"database/sql"
	"log"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/asg017/sqlite-vec-go-bindings/cgo"
	"github.com/mattn/go-sqlite3"
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
			if err := conn.LoadExtension("./rembed.so", "sqlite3_rembed_init"); err != nil {
				return err
			}
			return nil
		},
	})

	// Custom DBConnect function
	customDBConnect := func(dsn string) (*sql.DB, error) {
		db, err := sql.Open("sqlite-vec-rembed", dsn)
		if err != nil {
			return nil, err
		}
		return db, nil
	}

	app := pocketbase.NewWithConfig(&pocketbase.Config{
		DBConnect: customDBConnect,
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}