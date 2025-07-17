package migrations

import (
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/models/schema"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		jsonData := `{
			"id": "files_collection",
			"created": "2025-01-17 07:30:00.000Z",
			"updated": "2025-01-17 07:30:00.000Z",
			"name": "files",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "file_path",
					"name": "path",
					"type": "text",
					"required": true,
					"presentable": false,
					"unique": true,
					"options": {
						"min": null,
						"max": 500,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "file_name",
					"name": "name",
					"type": "text",
					"required": true,
					"presentable": true,
					"unique": false,
					"options": {
						"min": null,
						"max": 255,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "file_size",
					"name": "size",
					"type": "number",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"min": 0,
						"max": null,
						"noDecimal": true
					}
				},
				{
					"system": false,
					"id": "content_type",
					"name": "content_type",
					"type": "text",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"min": null,
						"max": 100,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "file_content",
					"name": "content",
					"type": "text",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"min": null,
						"max": null,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "file_extension",
					"name": "extension",
					"type": "text",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"min": null,
						"max": 10,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "mod_time",
					"name": "mod_time",
					"type": "date",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"min": "",
						"max": ""
					}
				},
				{
					"system": false,
					"id": "embedding_status",
					"name": "embedding_status",
					"type": "select",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"maxSelect": 1,
						"values": [
							"pending",
							"processing",
							"completed",
							"failed"
						]
					}
				}
			],
			"indexes": [
				"CREATE INDEX idx_files_path ON files (path)",
				"CREATE INDEX idx_files_extension ON files (extension)",
				"CREATE INDEX idx_files_embedding_status ON files (embedding_status)"
			],
			"listRule": null,
			"viewRule": null,
			"createRule": null,
			"updateRule": null,
			"deleteRule": null,
			"options": {}
		}`

		collection := &models.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return daos.New(db).SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db)

		collection, err := dao.FindCollectionByNameOrId("files")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
